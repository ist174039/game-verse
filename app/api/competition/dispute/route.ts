import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { matchId?: unknown; reason?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.matchId !== 'string' || typeof body.reason !== 'string' || !body.matchId || body.reason.trim().length < 5) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  try {
    const services = createApplicationServices(supabase)
    const dispute = await services.competitions.openDispute({ matchId: body.matchId, reason: body.reason.trim() })
    return NextResponse.json({ dispute })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'open_dispute_failed' }, { status: 409 }) }
}
