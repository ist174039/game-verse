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
    const { match_id } = body

    if (!match_id) {
      return NextResponse.json({ error: 'match_id required' }, { status: 400 })
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

    if (match.club_a_id !== club.id && match.club_b_id !== club.id) {
      return NextResponse.json({ error: 'Not your match' }, { status: 403 })
    }

    const updatingForA = match.club_a_id === club.id
    const confirmField = updatingForA ? 'confirmed_a' : 'confirmed_b'

    await supabase
      .from('match')
      .update({
        [confirmField]: true,
        status: match.confirmed_a || match.confirmed_b ? 'active' : 'pending',
      })
      .eq('id', match_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to confirm match'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
