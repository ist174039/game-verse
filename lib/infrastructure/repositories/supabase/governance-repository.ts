import type { SupabaseClient } from '@supabase/supabase-js'
import type { GovernanceRepository } from '@/lib/application/contracts'
import type { AdminAuditLog, CaseStatus, EconomicFreeze, FeatureFlag, ModerationCase, PlatformConfig, SupportTicket, TicketNote, TicketStatus } from '@/lib/domain/governance'
import type { UUID } from '@/lib/domain/core'

const mapTicket = (r:any):SupportTicket => ({id:r.id,requesterUserId:r.requester_user_id,clubId:r.club_id,universeId:r.universe_id,category:r.category,priority:r.priority,status:r.status,subject:r.subject,description:r.description,assignedAdminId:r.assigned_admin_id,metadata:r.metadata ?? {},createdAt:r.created_at,updatedAt:r.updated_at})
const mapCase = (r:any):ModerationCase => ({id:r.id,caseType:r.case_type,status:r.status,severity:r.severity,reporterUserId:r.reporter_user_id,targetUserId:r.target_user_id,targetClubId:r.target_club_id,targetUniverseId:r.target_universe_id,matchId:r.match_id,assignedAdminId:r.assigned_admin_id,summary:r.summary,evidence:r.evidence ?? [],signals:r.signals ?? {},resolution:r.resolution ?? null,createdAt:r.created_at,updatedAt:r.updated_at})
const mapFreeze = (r:any):EconomicFreeze => ({id:r.id,scope:r.scope,userId:r.user_id,clubId:r.club_id,universeId:r.universe_id,reason:r.reason,caseId:r.case_id,active:Boolean(r.active),createdBy:r.created_by,createdAt:r.created_at,releasedBy:r.released_by,releasedAt:r.released_at})
const mapFlag = (r:any):FeatureFlag => ({key:r.key,enabled:Boolean(r.enabled),scope:r.scope,scopeReference:r.scope_reference??null,configuration:r.configuration??{},updatedBy:r.updated_by??null,updatedAt:r.updated_at})
const mapConfig = (r:any):PlatformConfig => ({key:r.key,category:r.category,value:r.value,version:Number(r.version),effectiveFrom:r.effective_from,updatedBy:r.updated_by??null,updatedAt:r.updated_at})

export class SupabaseGovernanceRepository implements GovernanceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listTickets(limit = 100): Promise<SupportTicket[]> {
    const { data, error } = await this.client.from('support_ticket').select('*').order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map(mapTicket)
  }

  async listModerationCases(limit = 100): Promise<ModerationCase[]> {
    const { data, error } = await this.client.from('moderation_case').select('*').order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map(mapCase)
  }

  async listAuditLog(limit = 200): Promise<AdminAuditLog[]> {
    const { data, error } = await this.client.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:Number(r.id),actorUserId:r.actor_user_id,action:r.action,targetType:r.target_type,targetId:r.target_id,oldState:r.old_state,newState:r.new_state,reason:r.reason,ticketId:r.ticket_id,metadata:r.metadata ?? {},createdAt:r.created_at}))
  }

  async updateTicket(input:{ticketId:UUID;status:TicketStatus;assignedAdminId:UUID|null;actorUserId:UUID;reason:string}):Promise<SupportTicket>{
    const {data,error}=await this.client.rpc('service_update_support_ticket',{p_ticket_id:input.ticketId,p_status:input.status,p_assigned_admin_id:input.assignedAdminId,p_actor_user_id:input.actorUserId,p_reason:input.reason})
    if(error) throw error
    return mapTicket(data)
  }

  async addTicketNote(input:{ticketId:UUID;body:string;internal:boolean;actorUserId:UUID}):Promise<TicketNote>{
    const {data,error}=await this.client.rpc('service_add_ticket_note',{p_ticket_id:input.ticketId,p_body:input.body,p_internal:input.internal,p_actor_user_id:input.actorUserId})
    if(error) throw error
    return {id:data.id,ticketId:data.ticket_id,authorUserId:data.author_user_id,internal:Boolean(data.internal),body:data.body,createdAt:data.created_at}
  }

  async updateModerationCase(input:{caseId:UUID;status:CaseStatus;assignedAdminId:UUID|null;resolution:Record<string,unknown>|null;actorUserId:UUID;reason:string}):Promise<ModerationCase>{
    const {data,error}=await this.client.rpc('service_update_moderation_case',{p_case_id:input.caseId,p_status:input.status,p_assigned_admin_id:input.assignedAdminId,p_resolution:input.resolution,p_actor_user_id:input.actorUserId,p_reason:input.reason})
    if(error) throw error
    return mapCase(data)
  }

  async createEconomicFreeze(input:{scope:'USER'|'CLUB'|'UNIVERSE';targetId:UUID;reason:string;caseId:UUID|null;actorUserId:UUID}):Promise<EconomicFreeze>{
    const {data,error}=await this.client.rpc('service_create_economic_freeze',{
      p_scope:input.scope,
      p_user_id:input.scope==='USER'?input.targetId:null,
      p_club_id:input.scope==='CLUB'?input.targetId:null,
      p_universe_id:input.scope==='UNIVERSE'?input.targetId:null,
      p_reason:input.reason,
      p_case_id:input.caseId,
      p_actor_user_id:input.actorUserId,
    })
    if(error) throw error
    return mapFreeze(data)
  }

  async releaseEconomicFreeze(input:{freezeId:UUID;actorUserId:UUID;reason:string}):Promise<EconomicFreeze>{
    const {data,error}=await this.client.rpc('service_release_economic_freeze',{p_freeze_id:input.freezeId,p_actor_user_id:input.actorUserId,p_reason:input.reason})
    if(error) throw error
    return mapFreeze(data)
  }

  async setFeatureFlag(input:{key:string;enabled:boolean;scope:FeatureFlag['scope'];scopeReference:string|null;configuration:Record<string,unknown>;actorUserId:UUID;reason:string}):Promise<FeatureFlag>{
    const {data,error}=await this.client.rpc('service_set_feature_flag',{p_key:input.key,p_enabled:input.enabled,p_scope:input.scope,p_scope_reference:input.scopeReference,p_configuration:input.configuration,p_actor_user_id:input.actorUserId,p_reason:input.reason})
    if(error) throw error
    return mapFlag(data)
  }

  async setPlatformConfig(input:{key:string;category:string;value:unknown;effectiveFrom:string|null;actorUserId:UUID;reason:string;ticketId?:UUID|null}):Promise<PlatformConfig>{
    const {data,error}=await this.client.rpc('service_set_platform_config',{p_key:input.key,p_category:input.category,p_value:input.value,p_effective_from:input.effectiveFrom,p_actor_user_id:input.actorUserId,p_reason:input.reason,p_ticket_id:input.ticketId??null})
    if(error) throw error
    return mapConfig(data)
  }

  async markPaymentRefundPending(input:{orderId:UUID;actorUserId:UUID;reason:string;stripeRefundId:string}):Promise<void>{
    const {error}=await this.client.rpc('service_mark_payment_refund_pending',{p_order_id:input.orderId,p_actor_user_id:input.actorUserId,p_reason:input.reason,p_stripe_refund_id:input.stripeRefundId})
    if(error) throw error
  }

  async reverseMatchSettlement(input: { matchId: UUID; reason: string; idempotencyKey: string }): Promise<Record<string, unknown>> {
    const { data, error } = await this.client.rpc('service_reverse_match_settlement',{p_match_id:input.matchId,p_reason:input.reason,p_idempotency_key:input.idempotencyKey})
    if (error) throw error
    return data ?? {}
  }

  async reverseLedgerTransaction(input: { transactionId: UUID; reason: string; idempotencyKey: string }): Promise<UUID> {
    const { data, error } = await this.client.rpc('service_reverse_ledger_transaction',{p_transaction_id:input.transactionId,p_reason:input.reason,p_idempotency_key:input.idempotencyKey})
    if (error) throw error
    return data as UUID
  }
}
