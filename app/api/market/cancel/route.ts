import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { listingId?: unknown; universePlayerId?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  let listingId = typeof body.listingId === 'string' ? body.listingId : ''
  const universePlayerId = typeof body.universePlayerId === 'string' ? body.universePlayerId : ''
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : ''
  if ((!listingId && !universePlayerId) || idempotencyKey.length < 3) return NextResponse.json({ error: 'invalid_cancel_request' }, { status: 400 })

  try {
    if (!listingId) {
      const { data, error } = await supabase
        .from('market_listing')
        .select('id')
        .eq('universe_player_id', universePlayerId)
        .eq('status', 'ACTIVE')
        .maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'active_listing_not_found' }, { status: 404 })
      listingId = data.id
    }

    const services = createApplicationServices(supabase)
    await services.market.cancelListing({ listingId, idempotencyKey })
    return NextResponse.json({ success: true, listingId })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'cancel_listing_failed' }, { status: 409 })
  }
}
