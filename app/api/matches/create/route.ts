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
    const { opponent_id, match_type, home_away } = body

    if (!opponent_id || !match_type) {
      return NextResponse.json({ error: 'opponent_id and match_type required' }, { status: 400 })
    }

    // Get user's club
    const { data: userClub } = await supabase
      .from('club')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (!userClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    const timeoutAt = new Date(Date.now() + 48 * 3600000).toISOString()

    const { data: match, error } = await supabase
      .from('match')
      .insert({
        club_a_id: home_away === 'home' ? userClub.id : opponent_id,
        club_b_id: home_away === 'home' ? opponent_id : userClub.id,
        match_type,
        tournament_id: body.tournament_id || null,
        status: 'pending',
        timeout_at: timeoutAt,
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, match })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create match'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
