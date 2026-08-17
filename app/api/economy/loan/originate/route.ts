import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { clubId?: unknown; principal?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.clubId !== 'string' || typeof body.principal !== 'number' || !Number.isFinite(body.principal) || body.principal <= 0 || typeof body.idempotencyKey !== 'string') return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  try {
    const services = createApplicationServices(supabase)
    const loan = await services.clubEconomy.originateLoan({ clubId: body.clubId, principal: Math.floor(body.principal), idempotencyKey: body.idempotencyKey })
    return NextResponse.json({ loan })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'loan_origination_failed' }, { status: 409 })
  }
}
