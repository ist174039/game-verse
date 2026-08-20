import { NextResponse } from 'next/server'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { canAdmin, getAdminSession, type AdminAction } from '@/lib/server/admin-auth'
import type { CaseStatus, FeatureFlag, FreezeScope, TicketStatus } from '@/lib/domain/governance'

export const runtime='nodejs'

const actionCapability:Record<string,AdminAction>={
  'ticket-update':'TICKET','ticket-note':'TICKET','ticket-priority':'TICKET','ticket-reply':'TICKET',
  'moderation-update':'MODERATION','moderation-create':'MODERATION','moderation-evidence':'MODERATION','moderation-signal':'MODERATION',
  'freeze-create':'FREEZE','freeze-release':'FREEZE','feature-flag-update':'CONFIG','platform-config-update':'CONFIG',
}
const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
const text=(value:unknown)=>typeof value==='string'?value.trim():''
const uuidOrNull=(value:unknown)=>text(value)||null
function errorMessage(error:unknown){
  if(error instanceof Error)return error.message
  if(error&&typeof error==='object'){
    const value=error as {message?:unknown;details?:unknown;hint?:unknown}
    return [value.message,value.details,value.hint].find(item=>typeof item==='string'&&item.length>0) as string|undefined ?? 'admin_operation_failed'
  }
  return 'admin_operation_failed'
}

export async function POST(request:Request){
  const session=await getAdminSession()
  if(!session)return NextResponse.json({error:'admin_auth_required'},{status:401})
  let body:Record<string,unknown>
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const action=text(body.action),capability=actionCapability[action]
  if(!capability)return NextResponse.json({error:'unsupported_admin_action'},{status:400})
  if(!canAdmin(session.role,capability))return NextResponse.json({error:'admin_permission_denied'},{status:403})
  const services=createAdminApplicationServices(session.userClient,session.serviceClient)

  try{
    if(action==='ticket-update'){
      const ticketId=text(body.ticketId),status=text(body.status) as TicketStatus,reason=text(body.reason)
      if(!ticketId||!status||reason.length<5)throw new Error('invalid_ticket_update')
      const ticket=await services.governance.updateTicket({ticketId,status,assignedAdminId:body.assignedAdminId===null?null:uuidOrNull(body.assignedAdminId),actorUserId:session.user.id,reason})
      return NextResponse.json({ticket})
    }
    if(action==='ticket-note'){
      const ticketId=text(body.ticketId),note=text(body.body)
      if(!ticketId||note.length<2)throw new Error('invalid_ticket_note')
      const result=await services.governance.addTicketNote({ticketId,body:note,internal:body.internal!==false,actorUserId:session.user.id})
      return NextResponse.json({note:result})
    }
    if(action==='ticket-priority'){
      const ticketId=text(body.ticketId),priority=text(body.priority),reason=text(body.reason)
      if(!ticketId||!['LOW','NORMAL','HIGH','CRITICAL'].includes(priority)||reason.length<5)throw new Error('invalid_ticket_priority')
      const{data,error}=await session.serviceClient.rpc('service_set_support_ticket_priority',{p_ticket_id:ticketId,p_priority:priority,p_actor_user_id:session.user.id,p_reason:reason})
      if(error)throw error
      return NextResponse.json({ticket:data})
    }
    if(action==='ticket-reply'){
      const ticketId=text(body.ticketId),reply=text(body.body)
      if(!ticketId||reply.length<2)throw new Error('invalid_ticket_reply')
      const{data,error}=await session.serviceClient.rpc('service_reply_support_ticket',{p_ticket_id:ticketId,p_body:reply,p_actor_user_id:session.user.id})
      if(error)throw error
      return NextResponse.json({note:data})
    }
    if(action==='moderation-create'){
      const caseType=text(body.caseType),severity=text(body.severity),summary=text(body.summary),reason=text(body.reason)
      if(!['RESULT_DISPUTE','SOCIAL_REPORT','FRAUD','APPEAL','PAYMENT_RISK','OTHER'].includes(caseType)||!['LOW','MEDIUM','HIGH','CRITICAL'].includes(severity)||summary.length<5||reason.length<5)throw new Error('invalid_moderation_case')
      const{data,error}=await session.serviceClient.rpc('service_create_moderation_case',{
        p_case_type:caseType,p_severity:severity,p_summary:summary,p_reporter_user_id:uuidOrNull(body.reporterUserId),
        p_target_user_id:uuidOrNull(body.targetUserId),p_target_club_id:uuidOrNull(body.targetClubId),p_target_universe_id:uuidOrNull(body.targetUniverseId),p_match_id:uuidOrNull(body.matchId),
        p_assigned_admin_id:body.assignToMe===true?session.user.id:null,p_evidence:Array.isArray(body.evidence)?body.evidence:[],p_signals:isRecord(body.signals)?body.signals:{},p_actor_user_id:session.user.id,p_reason:reason,
      })
      if(error)throw error
      return NextResponse.json({case:data},{status:201})
    }
    if(action==='moderation-update'){
      const caseId=text(body.caseId),status=text(body.status) as CaseStatus,reason=text(body.reason)
      if(!caseId||!status||reason.length<5)throw new Error('invalid_moderation_update')
      const result=await services.governance.updateModerationCase({caseId,status,assignedAdminId:body.assignedAdminId===null?null:uuidOrNull(body.assignedAdminId),resolution:isRecord(body.resolution)?body.resolution:null,actorUserId:session.user.id,reason})
      return NextResponse.json({case:result})
    }
    if(action==='moderation-evidence'){
      const caseId=text(body.caseId),reason=text(body.reason)
      if(!caseId||!isRecord(body.evidence)||reason.length<5)throw new Error('invalid_moderation_evidence')
      const{data,error}=await session.serviceClient.rpc('service_add_moderation_evidence',{p_case_id:caseId,p_evidence:body.evidence,p_actor_user_id:session.user.id,p_reason:reason})
      if(error)throw error
      return NextResponse.json({case:data})
    }
    if(action==='moderation-signal'){
      const caseId=text(body.caseId),signalKey=text(body.signalKey),reason=text(body.reason)
      if(!caseId||signalKey.length<2||reason.length<5)throw new Error('invalid_moderation_signal')
      const signalValue=body.signalValue===undefined?null:body.signalValue
      const{data,error}=await session.serviceClient.rpc('service_add_moderation_signal',{p_case_id:caseId,p_signal_key:signalKey,p_signal_value:signalValue,p_actor_user_id:session.user.id,p_reason:reason})
      if(error)throw error
      return NextResponse.json({case:data})
    }
    if(action==='freeze-create'){
      const scope=text(body.scope) as FreezeScope,targetId=text(body.targetId),reason=text(body.reason)
      if(!['USER','CLUB','UNIVERSE'].includes(scope)||!targetId||reason.length<5)throw new Error('invalid_freeze_request')
      const freeze=await services.governance.createEconomicFreeze({scope,targetId,reason,caseId:uuidOrNull(body.caseId),actorUserId:session.user.id})
      return NextResponse.json({freeze})
    }
    if(action==='freeze-release'){
      const freezeId=text(body.freezeId),reason=text(body.reason)
      if(!freezeId||reason.length<5)throw new Error('invalid_freeze_release')
      const freeze=await services.governance.releaseEconomicFreeze({freezeId,actorUserId:session.user.id,reason})
      return NextResponse.json({freeze})
    }
    if(action==='feature-flag-update'){
      const key=text(body.key),reason=text(body.reason),scope=text(body.scope) as FeatureFlag['scope']
      if(!key||typeof body.enabled!=='boolean'||!['GLOBAL','ENVIRONMENT','UNIVERSE','COHORT'].includes(scope)||reason.length<5)throw new Error('invalid_feature_flag_update')
      const flag=await services.governance.setFeatureFlag({key,enabled:body.enabled,scope,scopeReference:uuidOrNull(body.scopeReference),configuration:isRecord(body.configuration)?body.configuration:{},actorUserId:session.user.id,reason})
      return NextResponse.json({flag})
    }
    if(action==='platform-config-update'){
      const key=text(body.key),category=text(body.category),reason=text(body.reason)
      if(!key||!category||reason.length<5)throw new Error('invalid_platform_config_update')
      const config=await services.governance.setPlatformConfig({key,category,value:body.value??{},effectiveFrom:text(body.effectiveFrom)||null,actorUserId:session.user.id,reason,ticketId:uuidOrNull(body.ticketId)})
      return NextResponse.json({config})
    }
    return NextResponse.json({error:'unsupported_admin_action'},{status:400})
  }catch(error){
    const code=errorMessage(error)
    console.error('[admin-governance]',{action,code,error})
    return NextResponse.json({error:code},{status:409})
  }
}
