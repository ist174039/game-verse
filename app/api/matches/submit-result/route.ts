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
    const { match_id, home_score, away_score } = body

    if (!match_id || home_score === undefined || away_score === undefined) {
      return NextResponse.json({ error: 'match_id, home_score, away_score required' }, { status: 400 })
    }

    const { data: club } = await supabase
      .from('club')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    const { data: match } = await supabase
      .from('match')
      .select('*')
      .eq('id', match_id)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const isClubA = match.club_a_id === club.id
    if (!isClubA && match.club_b_id !== club.id) {
      return NextResponse.json({ error: 'Not your match' }, { status: 403 })
    }

    const resultField = isClubA ? 'result_a_submitted' : 'result_b_submitted'
    const result = `${home_score}-${away_score}`

    await supabase
      .from('match')
      .update({ [resultField]: result, status: 'waiting_result' })
      .eq('id', match_id)

    // If both sides submitted, auto-complete
    const updatedMatch = await supabase
      .from('match')
      .select('*')
      .eq('id', match_id)
      .single()

    if (updatedMatch.data?.result_a_submitted && updatedMatch.data?.result_b_submitted) {
      const finalResult = updatedMatch.data.result_a_submitted
      
      // Determine winner
      const [h, a] = finalResult.split('-').map(Number)
      let winnerId: string | null = null
      if (h! > a!) winnerId = match.club_a_id
      else if (a! > h!) winnerId = match.club_b_id

      await supabase
        .from('match')
        .update({
          status: 'completed',
          final_result: finalResult,
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', match_id)

      // Trigger process-match via API
      const origin = req.headers.get('origin') || 'http://localhost:3000'
      fetch(`${origin}/api/matches/${match_id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal: true }),
      }).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit result'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
