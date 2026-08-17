import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { matchId?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.matchId !== 'string' || typeof body.idempotencyKey !== 'string' || !body.matchId || !body.idempotencyKey) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  try {
    const services = createApplicationServices(supabase)
    const receipt = await services.competitions.confirmResult({ matchId: body.matchId, idempotencyKey: body.idempotencyKey })
    return NextResponse.json({ receipt })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'confirm_result_failed' }, { status: 409 }) }
}
