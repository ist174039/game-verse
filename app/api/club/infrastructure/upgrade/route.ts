import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import type { InfrastructureType } from '@/lib/domain/club-economy'

const TYPES: InfrastructureType[] = ['STADIUM','ACADEMY','TRAINING','MARKETING','FINANCE']

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { clubId?: unknown; infrastructureType?: unknown; idempotencyKey?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (typeof body.clubId !== 'string' || typeof body.infrastructureType !== 'string' || typeof body.idempotencyKey !== 'string' || !TYPES.includes(body.infrastructureType as InfrastructureType)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  try {
    const services = createApplicationServices(supabase)
    const receipt = await services.clubs.upgradeInfrastructure({ clubId: body.clubId, infrastructureType: body.infrastructureType as InfrastructureType, idempotencyKey: body.idempotencyKey })
    return NextResponse.json({ receipt })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'infrastructure_upgrade_failed' }, { status: 409 })
  }
}
