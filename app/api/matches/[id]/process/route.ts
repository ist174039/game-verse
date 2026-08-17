import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Processes a completed match: Elo calculation, GC rewards, rivalry detection.
 * Called internally after match completion or by cron/Edge Function.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: match } = await supabase
      .from('match')
      .select('*')
      .eq('id', id)
      .eq('status', 'completed')
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found or not completed' }, { status: 404 })
    }

    // Get clubs
    const { data: clubA } = await supabase.from('club').select('*').eq('id', match.club_a_id).single()
    const { data: clubB } = await supabase.from('club').select('*').eq('id', match.club_b_id).single()
    if (!clubA || !clubB) {
      return NextResponse.json({ error: 'Clubs not found' }, { status: 404 })
    }

    const eloA = clubA.elo_rating ?? 1200
    const eloB = clubB.elo_rating ?? 1200

    const [h, a] = (match.final_result ?? '0-0').split('-').map(Number)
    const resultA = h! > a! ? 1 : h === a ? 0.5 : 0
    const resultB = 1 - resultA

    const K = 16
    const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
    const expectedB = 1 / (1 + Math.pow(10, (eloA - eloB) / 400))

    const eloChangeA = Math.round(K * (resultA - expectedA))
    const eloChangeB = Math.round(K * (resultB - expectedB))

    // Update Elo
    await supabase.from('club').update({ elo_rating: eloA + eloChangeA }).eq('id', clubA.id)
    await supabase.from('club').update({ elo_rating: eloB + eloChangeB }).eq('id', clubB.id)

    // Record Elo history
    await supabase.from('elo_history').insert([
      { club_id: clubA.id, match_id: id, elo_before: eloA, elo_after: eloA + eloChangeA, elo_change: eloChangeA },
      { club_id: clubB.id, match_id: id, elo_before: eloB, elo_after: eloB + eloChangeB, elo_change: eloChangeB },
    ])

    // Distribute rewards
    const rewards = { win: 150, draw: 50, loss: 0 }
    const rewardA = resultA === 1 ? rewards.win : resultA === 0.5 ? rewards.draw : rewards.loss
    const rewardB = resultB === 1 ? rewards.win : resultB === 0.5 ? rewards.draw : rewards.loss

    for (const [clubUserId, amount, key] of [
      [clubA.user_id, rewardA, `match_${id}_A`],
      [clubB.user_id, rewardB, `match_${id}_B`],
    ] as [string, number, string][]) {
      if (amount > 0) {
        await supabase.rpc('credit_gc', {
          p_user_id: clubUserId,
          p_amount: amount,
          p_idempotency_key: key,
        })
      }
    }

    return NextResponse.json({
      success: true,
      eloChanges: { [clubA.id]: eloChangeA, [clubB.id]: eloChangeB },
      rewards: { [clubA.id]: rewardA, [clubB.id]: rewardB },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process match'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
