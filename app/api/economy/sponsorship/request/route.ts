import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { clubId?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.clubId !== 'string' || !body.clubId) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

  try {
    const services = createApplicationServices(supabase)
    const contract = await services.clubEconomy.requestSponsorshipOffer(body.clubId)
    return NextResponse.json({ contract })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'sponsorship_request_failed' }, { status: 409 })
  }
}
