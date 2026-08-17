import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { listingId?: unknown; amount?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (typeof body.listingId !== 'string' || !body.listingId || typeof body.idempotencyKey !== 'string' || !body.idempotencyKey || typeof body.amount !== 'number' || !Number.isSafeInteger(body.amount) || body.amount <= 0) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  try {
    const services = createApplicationServices(supabase)
    const bid = await services.market.placeAuctionBid({ listingId: body.listingId, amount: body.amount, idempotencyKey: body.idempotencyKey })
    return NextResponse.json({ bid })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'auction_bid_failed'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
