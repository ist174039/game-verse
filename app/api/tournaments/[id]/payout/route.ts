import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: economy } = await supabase
      .from('tournament_economy')
      .select('*')
      .eq('tournament_id', id)
      .single()

    if (!economy) {
      return NextResponse.json({ error: 'Tournament economy not found' }, { status: 404 })
    }

    if (economy.status !== 'ready') {
      return NextResponse.json({ error: 'Economy not ready for distribution' }, { status: 400 })
    }

    await supabase.from('tournament_economy').update({ status: 'distributing' }).eq('id', economy.id)

    const { data: participants } = await supabase
      .from('tournament_participant')
      .select('*')
      .eq('tournament_id', id)
      .order('final_position', { ascending: true })

    const distribution = economy.distribution_config ?? { 1: 50, 2: 30, 3: 15, 4: 5 }
    const prizePool = economy.total_prize_pool
    let totalDistributed = 0

    for (const participant of participants ?? []) {
      const pct = distribution[participant.final_position] ?? 0
      const amount = Math.round((prizePool * pct) / 100)
      if (amount <= 0) continue

      await supabase.from('tournament_payout').insert({
        tournament_id: id,
        club_id: participant.club_id,
        user_id: participant.user_id,
        position: participant.final_position,
        amount_gc: amount,
        status: 'paid',
        paid_at: new Date().toISOString(),
      }).select('*').single()

      const { error: creditError } = await supabase.rpc('credit_gc', {
        p_user_id: participant.user_id,
        p_amount: amount,
        p_idempotency_key: `tp_${id}_pos${participant.final_position}`,
      })

      if (!creditError) totalDistributed += amount
    }

    await supabase.from('tournament_economy').update({
      status: 'distributed',
      total_distributed: totalDistributed,
      distributed_at: new Date().toISOString(),
    }).eq('id', economy.id)

    return NextResponse.json({ success: true, totalDistributed })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to distribute prizes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
