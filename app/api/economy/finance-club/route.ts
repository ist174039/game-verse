import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

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
    const message = error instanceof Error ? error.message : 'financing_failed'
    return NextResponse.json({ error:message }, { status:400 })
  }
}
