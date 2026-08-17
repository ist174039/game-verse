import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { matchId?: unknown; homeScore?: unknown; awayScore?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.matchId !== 'string' || typeof body.idempotencyKey !== 'string' || typeof body.homeScore !== 'number' || typeof body.awayScore !== 'number' || !Number.isSafeInteger(body.homeScore) || !Number.isSafeInteger(body.awayScore) || body.homeScore < 0 || body.awayScore < 0) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  try {
    const services = createApplicationServices(supabase)
    const match = await services.competitions.submitResult({ matchId: body.matchId, homeScore: body.homeScore, awayScore: body.awayScore, idempotencyKey: body.idempotencyKey })
    return NextResponse.json({ match })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'submit_result_failed' }, { status: 409 }) }
}
