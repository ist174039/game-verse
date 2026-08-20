import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

const knownRegistrationErrors = [
  'competition_not_found',
  'registration_closed',
  'club_required_in_universe',
  'already_registered',
  'competitive_roster_ineligible',
  'economic_scope_frozen',
  'club_silver_account_not_found',
  'insufficient_silver',
  'idempotency_key_required',
  'idempotency_key_conflict',
] as const

function normalizeRegistrationError(error: unknown) {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {}
  const message = error instanceof Error ? error.message : typeof record.message === 'string' ? record.message : ''
  const code = typeof record.code === 'string' ? record.code : ''
  const details = typeof record.details === 'string' ? record.details : ''
  const hint = typeof record.hint === 'string' ? record.hint : ''
  const diagnostic = `${message} ${details} ${hint}`
  const missingRuntime = code === 'PGRST202' || code === '42883' || (/could not find/i.test(diagnostic) && /register_for_competition/i.test(diagnostic))
  const clientError = missingRuntime
    ? 'competition_runtime_not_migrated'
    : knownRegistrationErrors.find(key => diagnostic.includes(key)) ?? 'competition_registration_failed'
  const roster = diagnostic.match(/competitive_roster_ineligible:\s*(\d+)\s+eligible,\s*(\d+)\s+required/i)
  return {
    clientError,
    message,
    code,
    details,
    hint,
    context: roster ? { eligiblePlayers: Number(roster[1]), requiredPlayers: Number(roster[2]) } : null,
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { competitionId?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const competitionId = typeof body.competitionId === 'string' ? body.competitionId.trim() : ''
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : ''
  if (!competitionId || idempotencyKey.length < 8) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

  try {
    const services = createApplicationServices(supabase)
    const registration = await services.competitions.register({ competitionId, idempotencyKey })
    return NextResponse.json({ registration })
  } catch (error) {
    const normalized = normalizeRegistrationError(error)
    console.error('[competition-registration]', {
      competitionId,
      userId: user.id,
      message: normalized.message,
      code: normalized.code,
      details: normalized.details,
      hint: normalized.hint,
    })
    return NextResponse.json(
      { error: normalized.clientError, context: normalized.context },
      { status: normalized.clientError === 'competition_runtime_not_migrated' ? 503 : 409 },
    )
  }
}
