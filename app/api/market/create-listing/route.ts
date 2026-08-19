import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: {
    universePlayerId?: unknown
    listingType?: unknown
    askingPrice?: unknown
    buyNowPrice?: unknown
    durationHours?: unknown
    idempotencyKey?: unknown
  }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const universePlayerId = typeof body.universePlayerId === 'string' ? body.universePlayerId : ''
  const listingType = typeof body.listingType === 'string' ? body.listingType.toUpperCase() : ''
  const askingPrice = typeof body.askingPrice === 'number' ? body.askingPrice : NaN
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : ''
  if (!universePlayerId || !['DIRECT','AUCTION'].includes(listingType) || !Number.isSafeInteger(askingPrice) || askingPrice <= 0 || idempotencyKey.length < 8) {
    return NextResponse.json({ error: 'invalid_listing_request' }, { status: 400 })
  }

  try {
    const services = createApplicationServices(supabase)
    if (listingType === 'DIRECT') {
      const listing = await services.market.createDirectListing({ universePlayerId, askingPrice, idempotencyKey })
      return NextResponse.json({ listing })
    }

    const durationHours = typeof body.durationHours === 'number' ? body.durationHours : 24
    const buyNowPrice = body.buyNowPrice == null || body.buyNowPrice === '' ? null : Number(body.buyNowPrice)
    if (!Number.isSafeInteger(durationHours) || durationHours < 1 || durationHours > 168) {
      return NextResponse.json({ error: 'invalid_auction_duration' }, { status: 400 })
    }
    if (buyNowPrice != null && (!Number.isSafeInteger(buyNowPrice) || buyNowPrice < askingPrice)) {
      return NextResponse.json({ error: 'invalid_buy_now_price' }, { status: 400 })
    }

    const listing = await services.market.createAuctionListing({
      universePlayerId,
      startingPrice: askingPrice,
      buyNowPrice,
      endsAt: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
      idempotencyKey,
    })
    return NextResponse.json({ listing })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'create_listing_failed' }, { status: 409 })
  }
}
