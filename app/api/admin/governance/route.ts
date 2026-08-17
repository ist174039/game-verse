import { NextResponse } from 'next/server'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { canAdmin, getAdminSession, type AdminAction } from '@/lib/server/admin-auth'
import type { CaseStatus, FeatureFlag, FreezeScope, TicketStatus } from '@/lib/domain/governance'

export const runtime = 'nodejs'

const actionCapability: Record<string, AdminAction> = {
  'ticket-update':'TICKET',
  'ticket-note':'TICKET',
  'moderation-update':'MODERATION',
  'freeze-create':'FREEZE',
  'freeze-release':'FREEZE',
  'feature-flag-update':'CONFIG',
  'platform-config-update':'CONFIG',
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({error:'admin_auth_required'},{status:401})

  let body: Record<string, unknown>
  try { body = await request.json() as Record<string, unknown> } catch { return NextResponse.json({error:'invalid_json'},{status:400}) }
  const action = text(body.action)
  const capability = actionCapability[action]
  if (!capability) return NextResponse.json({error:'unsupported_admin_action'},{status:400})
  if (!canAdmin(session.role,capability)) return NextResponse.json({error:'admin_permission_denied'},{status:403})

  const services = createAdminApplicationServices(session.userClient,session.serviceClient)
  try {
    if (action === 'ticket-update') {
      const ticketId=text(body.ticketId), status=text(body.status) as TicketStatus, reason=text(body.reason)
      if(!ticketId||!status||reason.length<5) throw new Error('invalid_ticket_update')
      const ticket=await services.governance.updateTicket({ticketId,status,assignedAdminId:body.assignedAdminId===null?null:text(body.assignedAdminId)||null,actorUserId:session.user.id,reason})
      return NextResponse.json({ticket})
    }
    if (action === 'ticket-note') {
      const ticketId=text(body.ticketId), note=text(body.body)
      if(!ticketId||note.length<2) throw new Error('invalid_ticket_note')
      const result=await services.governance.addTicketNote({ticketId,body:note,internal:body.internal!==false,actorUserId:session.user.id})
      return NextResponse.json({note:result})
    }
    if (action === 'moderation-update') {
      const caseId=text(body.caseId), status=text(body.status) as CaseStatus, reason=text(body.reason)
      if(!caseId||!status||reason.length<5) throw new Error('invalid_moderation_update')
      const result=await services.governance.updateModerationCase({caseId,status,assignedAdminId:body.assignedAdminId===null?null:text(body.assignedAdminId)||null,resolution:isRecord(body.resolution)?body.resolution:null,actorUserId:session.user.id,reason})
      return NextResponse.json({case:result})
    }
    if (action === 'freeze-create') {
      const scope=text(body.scope) as FreezeScope, targetId=text(body.targetId), reason=text(body.reason)
      if(!['USER','CLUB','UNIVERSE'].includes(scope)||!targetId||reason.length<5) throw new Error('invalid_freeze_request')
      const freeze=await services.governance.createEconomicFreeze({scope,targetId,reason,caseId:text(body.caseId)||null,actorUserId:session.user.id})
      return NextResponse.json({freeze})
    }
    if (action === 'freeze-release') {
      const freezeId=text(body.freezeId), reason=text(body.reason)
      if(!freezeId||reason.length<5) throw new Error('invalid_freeze_release')
      const freeze=await services.governance.releaseEconomicFreeze({freezeId,actorUserId:session.user.id,reason})
      return NextResponse.json({freeze})
    }
    if (action === 'feature-flag-update') {
      const key=text(body.key), reason=text(body.reason), scope=text(body.scope) as FeatureFlag['scope']
      if(!key||typeof body.enabled!=='boolean'||!['GLOBAL','ENVIRONMENT','UNIVERSE','COHORT'].includes(scope)||reason.length<5) throw new Error('invalid_feature_flag_update')
      const flag=await services.governance.setFeatureFlag({key,enabled:body.enabled,scope,scopeReference:text(body.scopeReference)||null,configuration:isRecord(body.configuration)?body.configuration:{},actorUserId:session.user.id,reason})
      return NextResponse.json({flag})
    }
    if (action === 'platform-config-update') {
      const key=text(body.key), category=text(body.category), reason=text(body.reason)
      if(!key||!category||reason.length<5) throw new Error('invalid_platform_config_update')
      const config=await services.governance.setPlatformConfig({key,category,value:body.value??{},effectiveFrom:text(body.effectiveFrom)||null,actorUserId:session.user.id,reason,ticketId:text(body.ticketId)||null})
      return NextResponse.json({config})
    }
    return NextResponse.json({error:'unsupported_admin_action'},{status:400})
  } catch (error) {
    return NextResponse.json({error:error instanceof Error?error.message:'admin_operation_failed'},{status:409})
  }
}
