import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { tournament_id } = body

    if (!tournament_id) {
      return NextResponse.json({ error: 'tournament_id required' }, { status: 400 })
    }

    const { data: tournament } = await supabase
      .from('tournament')
      .select('*')
      .eq('id', tournament_id)
      .single()

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.status !== 'registration') {
      return NextResponse.json({ error: 'Registration closed' }, { status: 400 })
    }

    if (tournament.participants_count >= tournament.max_participants) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 })
    }

    const { data: club } = await supabase
      .from('club')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('tournament_participant')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('club_id', club.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 })
    }

    // Check entry fee
    const { data: economy } = await supabase
      .from('tournament_economy')
      .select('*')
      .eq('tournament_id', tournament_id)
      .maybeSingle()

    if (economy && economy.entry_fee > 0) {
      const { error: deductError } = await supabase.rpc('deduct_balance', {
        p_user_id: user.id,
        p_amount: economy.entry_fee,
        p_description: `Tournament entry: ${tournament.name}`,
      })

      if (deductError) {
        return NextResponse.json({ error: 'Insufficient balance for entry fee' }, { status: 400 })
      }
    }

    const { data: participant, error } = await supabase
      .from('tournament_participant')
      .insert({
        tournament_id,
        club_id: club.id,
        user_id: user.id,
        status: 'registered',
      })
      .select('*')
      .single()

    if (error) throw error

    // Update participant count
    await supabase
      .from('tournament')
      .update({ participants_count: tournament.participants_count + 1 })
      .eq('id', tournament_id)

    return NextResponse.json({ success: true, participant })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to register'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
