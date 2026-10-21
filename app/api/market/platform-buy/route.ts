import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { allowlistedErrorCode, MARKET_ERROR_CODES } from '@/lib/server/safe-error-code'

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
    return NextResponse.json({ error: allowlistedErrorCode(error, MARKET_ERROR_CODES, 'platform_player_purchase_failed') }, { status: 409 })
  }
}
