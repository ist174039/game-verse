import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { matchId?: unknown; playerIds?: unknown; formation?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (
    typeof body.matchId !== 'string' || !body.matchId ||
    !Array.isArray(body.playerIds) || body.playerIds.length !== 11 || body.playerIds.some(id => typeof id !== 'string') ||
    (body.formation != null && typeof body.formation !== 'string')
  ) return NextResponse.json({ error: 'invalid_lineup_request' }, { status: 400 })

  try {
    const { data, error } = await supabase.rpc('save_match_lineup', {
      p_match_id: body.matchId,
      p_player_ids: body.playerIds,
      p_formation: typeof body.formation === 'string' ? body.formation : '4-3-3',
    })
    if (error) throw error
    return NextResponse.json({ lineup: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'save_lineup_failed' }, { status: 409 })
  }
}
