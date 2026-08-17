import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminPlatformOverviewReadRepository } from '@/lib/application/read-repositories'
import type { AdminPlatformOverviewReadModel } from '@/lib/application/read-models'

const count = (value: number | null) => Number(value ?? 0)
const num = (value: unknown) => Number(value ?? 0)

export class SupabaseAdminPlatformOverviewReadRepository implements AdminPlatformOverviewReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(): Promise<AdminPlatformOverviewReadModel> {
    const [usersQ,clubsQ,universesQ,activeUniversesQ,competitionsQ,unsettledMatchesQ,activeListingsQ,openTicketsQ,criticalTicketsQ,openCasesQ,activeFreezesQ,pendingPaymentsQ,refundQueueQ,flagsCountQ,flagsEnabledQ,recentUsersQ,recentUniversesQ,paymentsQ,ticketsQ,casesQ,flagsQ,configsQ,auditQ] = await Promise.all([
      this.client.from('user_profile').select('id',{count:'exact',head:true}),
      this.client.from('club').select('id',{count:'exact',head:true}),
      this.client.from('universe').select('id',{count:'exact',head:true}),
      this.client.from('universe').select('id',{count:'exact',head:true}).in('state',['ACTIVE','SEASON_RUNNING','OPEN_FOR_MEMBERS']),
      this.client.from('competition').select('id',{count:'exact',head:true}),
      this.client.from('match').select('id',{count:'exact',head:true}).not('state','in','(SETTLED,CANCELLED)'),
      this.client.from('market_listing').select('id',{count:'exact',head:true}).eq('status','ACTIVE'),
      this.client.from('support_ticket').select('id',{count:'exact',head:true}).not('status','in','(RESOLVED,CLOSED)'),
      this.client.from('support_ticket').select('id',{count:'exact',head:true}).eq('priority','CRITICAL').not('status','in','(RESOLVED,CLOSED)'),
      this.client.from('moderation_case').select('id',{count:'exact',head:true}).not('status','in','(RESOLVED,DISMISSED)'),
      this.client.from('economic_freeze').select('id',{count:'exact',head:true}).eq('active',true),
      this.client.from('payment_order').select('id',{count:'exact',head:true}).eq('status','PENDING'),
      this.client.from('payment_order').select('id',{count:'exact',head:true}).in('status',['REFUND_PENDING','PARTIALLY_REFUNDED']),
      this.client.from('feature_flag').select('key',{count:'exact',head:true}),
      this.client.from('feature_flag').select('key',{count:'exact',head:true}).eq('enabled',true),
      this.client.from('user_profile').select('id,username,manager_level,reputation,created_at').order('created_at',{ascending:false}).limit(6),
      this.client.from('universe').select('id,name,kind,state,access_policy,economic_profile,financing_policy,created_at').order('created_at',{ascending:false}).limit(8),
      this.client.from('payment_order').select('id,user_id,status,amount_cents,fiat_currency,gold_amount,refunded_cents,created_at').order('created_at',{ascending:false}).limit(8),
      this.client.from('support_ticket').select('*').order('created_at',{ascending:false}).limit(6),
      this.client.from('moderation_case').select('*').order('created_at',{ascending:false}).limit(6),
      this.client.from('feature_flag').select('key,enabled,scope,scope_reference,updated_at').order('updated_at',{ascending:false}).limit(8),
      this.client.from('platform_config').select('key,category,version,effective_from,updated_at').order('updated_at',{ascending:false}).limit(8),
      this.client.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(10),
    ])
    const results=[usersQ,clubsQ,universesQ,activeUniversesQ,competitionsQ,unsettledMatchesQ,activeListingsQ,openTicketsQ,criticalTicketsQ,openCasesQ,activeFreezesQ,pendingPaymentsQ,refundQueueQ,flagsCountQ,flagsEnabledQ,recentUsersQ,recentUniversesQ,paymentsQ,ticketsQ,casesQ,flagsQ,configsQ,auditQ]
    const failure=results.find(result=>result.error)
    if(failure?.error) throw failure.error
    return {
      metrics:{users:count(usersQ.count),clubs:count(clubsQ.count),universes:count(universesQ.count),activeUniverses:count(activeUniversesQ.count),competitions:count(competitionsQ.count),unsettledMatches:count(unsettledMatchesQ.count),activeListings:count(activeListingsQ.count),openTickets:count(openTicketsQ.count),criticalTickets:count(criticalTicketsQ.count),openModerationCases:count(openCasesQ.count),activeFreezes:count(activeFreezesQ.count),pendingPayments:count(pendingPaymentsQ.count),refundQueue:count(refundQueueQ.count),enabledFeatureFlags:count(flagsEnabledQ.count),totalFeatureFlags:count(flagsCountQ.count)},
      recentUsers:(recentUsersQ.data??[]).map((r:any)=>({id:r.id,username:r.username,managerLevel:num(r.manager_level),reputation:num(r.reputation),createdAt:r.created_at})),
      universes:(recentUniversesQ.data??[]).map((r:any)=>({id:r.id,name:r.name,kind:r.kind,state:r.state,accessPolicy:r.access_policy,economicProfile:r.economic_profile,financingPolicy:r.financing_policy,createdAt:r.created_at})),
      payments:(paymentsQ.data??[]).map((r:any)=>({id:r.id,userId:r.user_id,status:r.status,amountCents:num(r.amount_cents),currency:r.fiat_currency,goldAmount:num(r.gold_amount),refundedCents:num(r.refunded_cents),createdAt:r.created_at})),
      tickets:(ticketsQ.data??[]).map((r:any)=>({id:r.id,requesterUserId:r.requester_user_id,clubId:r.club_id,universeId:r.universe_id,category:r.category,priority:r.priority,status:r.status,subject:r.subject,description:r.description,assignedAdminId:r.assigned_admin_id,metadata:r.metadata??{},createdAt:r.created_at,updatedAt:r.updated_at})),
      moderationCases:(casesQ.data??[]).map((r:any)=>({id:r.id,caseType:r.case_type,status:r.status,severity:r.severity,reporterUserId:r.reporter_user_id,targetUserId:r.target_user_id,targetClubId:r.target_club_id,targetUniverseId:r.target_universe_id,matchId:r.match_id,assignedAdminId:r.assigned_admin_id,summary:r.summary,evidence:r.evidence??[],signals:r.signals??{},resolution:r.resolution??null,createdAt:r.created_at,updatedAt:r.updated_at})),
      featureFlags:(flagsQ.data??[]).map((r:any)=>({key:r.key,enabled:Boolean(r.enabled),scope:r.scope,scopeReference:r.scope_reference??null,updatedAt:r.updated_at})),
      configs:(configsQ.data??[]).map((r:any)=>({key:r.key,category:r.category,version:num(r.version),effectiveFrom:r.effective_from,updatedAt:r.updated_at})),
      auditLog:(auditQ.data??[]).map((r:any)=>({id:num(r.id),actorUserId:r.actor_user_id,action:r.action,targetType:r.target_type,targetId:r.target_id,oldState:r.old_state,newState:r.new_state,reason:r.reason,ticketId:r.ticket_id,metadata:r.metadata??{},createdAt:r.created_at})),
    }
  }
}
