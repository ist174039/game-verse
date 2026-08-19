import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { universePlayerId?: unknown; targetStatus?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const universePlayerId = typeof body.universePlayerId === 'string' ? body.universePlayerId : ''
  const targetStatus = typeof body.targetStatus === 'string' ? body.targetStatus.toUpperCase() : ''
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : ''

  if (!universePlayerId || !['ACTIVE','RESERVE'].includes(targetStatus) || idempotencyKey.length < 8) {
    return NextResponse.json({ error: 'invalid_operational_status_request' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase.rpc('set_player_operational_status', {
      p_universe_player_id: universePlayerId,
      p_target_status: targetStatus,
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw error
    return NextResponse.json({ player: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'operational_status_update_failed' }, { status: 409 })
  }
}
