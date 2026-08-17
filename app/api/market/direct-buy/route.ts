import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { listingId?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.listingId !== 'string' || typeof body.idempotencyKey !== 'string' || !body.listingId || !body.idempotencyKey) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  try {
    const services = createApplicationServices(supabase)
    const receipt = await services.market.buyDirectListing({ listingId: body.listingId, idempotencyKey: body.idempotencyKey })
    return NextResponse.json({ receipt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'market_purchase_failed'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
