import type { SupabaseClient } from '@supabase/supabase-js'
import type { GovernanceRepository } from '@/lib/application/contracts'
import type { AdminAuditLog, ModerationCase, SupportTicket } from '@/lib/domain/governance'
import type { UUID } from '@/lib/domain/core'

export class SupabaseGovernanceRepository implements GovernanceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listTickets(limit = 100): Promise<SupportTicket[]> {
    const { data, error } = await this.client.from('support_ticket').select('*').order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,requesterUserId:r.requester_user_id,clubId:r.club_id,universeId:r.universe_id,category:r.category,priority:r.priority,status:r.status,subject:r.subject,description:r.description,assignedAdminId:r.assigned_admin_id,metadata:r.metadata ?? {},createdAt:r.created_at,updatedAt:r.updated_at}))
  }

  async listModerationCases(limit = 100): Promise<ModerationCase[]> {
    const { data, error } = await this.client.from('moderation_case').select('*').order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,caseType:r.case_type,status:r.status,severity:r.severity,reporterUserId:r.reporter_user_id,targetUserId:r.target_user_id,targetClubId:r.target_club_id,targetUniverseId:r.target_universe_id,matchId:r.match_id,assignedAdminId:r.assigned_admin_id,summary:r.summary,evidence:r.evidence ?? [],signals:r.signals ?? {},resolution:r.resolution ?? null,createdAt:r.created_at,updatedAt:r.updated_at}))
  }

  async listAuditLog(limit = 200): Promise<AdminAuditLog[]> {
    const { data, error } = await this.client.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:Number(r.id),actorUserId:r.actor_user_id,action:r.action,targetType:r.target_type,targetId:r.target_id,oldState:r.old_state,newState:r.new_state,reason:r.reason,ticketId:r.ticket_id,metadata:r.metadata ?? {},createdAt:r.created_at}))
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
