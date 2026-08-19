import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { universePlayerId?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.universePlayerId !== 'string' || !body.universePlayerId || typeof body.idempotencyKey !== 'string' || body.idempotencyKey.length < 8) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  try {
    const services = createApplicationServices(supabase)
    const receipt = await services.market.buyPlatformPlayer({
      universePlayerId: body.universePlayerId,
      idempotencyKey: body.idempotencyKey,
    })
    return NextResponse.json({ receipt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'platform_player_purchase_failed'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
