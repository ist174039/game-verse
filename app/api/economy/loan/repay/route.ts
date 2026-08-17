import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { loanId?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.loanId !== 'string' || typeof body.idempotencyKey !== 'string') return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  try {
    const services = createApplicationServices(supabase)
    const receipt = await services.clubEconomy.repayLoanInstallment({ loanId: body.loanId, idempotencyKey: body.idempotencyKey })
    return NextResponse.json({ receipt })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'loan_repayment_failed' }, { status: 409 })
  }
}
