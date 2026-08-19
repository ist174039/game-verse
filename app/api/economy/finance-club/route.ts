import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

const financingErrors = new Set([
  'amount_must_be_positive',
  'idempotency_key_required',
  'idempotency_key_conflict',
  'club_not_found',
  'club_not_owned',
  'economic_scope_frozen',
  'gold_financing_disabled',
  'financing_minimum_not_met',
  'financing_operation_limit_exceeded',
  'financing_cycle_limit_exceeded',
  'insufficient_gold',
  'club_silver_account_not_found',
])

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : ''
  return [...financingErrors].find(code => message.includes(code)) ?? 'financing_failed'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error:'authentication_required' }, { status:401 })

  let body: { clubId?: string; goldAmount?: number; idempotencyKey?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error:'invalid_json' }, { status:400 }) }
  const goldAmount = Number(body.goldAmount)
  if (!body.clubId || !body.idempotencyKey || !Number.isSafeInteger(goldAmount) || goldAmount <= 0) return NextResponse.json({ error:'invalid_financing_request' }, { status:400 })

  try {
    const services = createApplicationServices(supabase)
    const receipt = await services.clubEconomy.financeWithGold({ clubId:body.clubId, goldAmount, idempotencyKey:body.idempotencyKey })
    return NextResponse.json(receipt)
  } catch (error) {
    return NextResponse.json({ error:publicError(error) }, { status:400 })
  }
}
