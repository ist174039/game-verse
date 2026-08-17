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
    const { name, description, match_type, max_participants, start_date, format_type, entry_fee, prize_pool } = body

    if (!name || !format_type) {
      return NextResponse.json({ error: 'name and format_type required' }, { status: 400 })
    }

    const { data: club } = await supabase
      .from('club')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    const { data: tournament, error } = await supabase
      .from('tournament')
      .insert({
        name,
        description: description || '',
        creator_club_id: club.id,
        match_type: match_type || 'friendly',
        max_participants: max_participants || 8,
        participants_count: 0,
        start_date: start_date || new Date(Date.now() + 7 * 86400000).toISOString(),
        format_type,
        status: 'registration',
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error

    // Create economy if entry_fee specified
    if (entry_fee || prize_pool) {
      await supabase
        .from('tournament_economy')
        .insert({
          tournament_id: tournament.id,
          entry_fee: entry_fee || 0,
          total_prize_pool: prize_pool || 0,
          distribution_config: { 1: 50, 2: 30, 3: 15, 4: 5 },
          status: 'pending',
        })
    }

    // Auto-register creator
    await supabase
      .from('tournament_participant')
      .insert({
        tournament_id: tournament.id,
        club_id: club.id,
        user_id: user.id,
        status: 'registered',
      })

    return NextResponse.json({ success: true, tournament })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create tournament'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
