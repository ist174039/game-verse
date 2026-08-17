import type { SupabaseClient } from '@supabase/supabase-js'
import type { OperationsRepository } from '@/lib/application/contracts'
import type { ClubLiability, MatchFinancialEvent } from '@/lib/domain/operations'
import type { UUID } from '@/lib/domain/core'

const n = (v: unknown) => Number(v ?? 0)

export class SupabaseOperationsRepository implements OperationsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listClubLiabilities(clubId: UUID): Promise<ClubLiability[]> {
    const { data, error } = await this.client.from('club_liability').select('*').eq('club_id',clubId).order('created_at',{ascending:false})
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,clubId:r.club_id,liabilityType:r.liability_type,referenceType:r.reference_type ?? null,referenceId:r.reference_id ?? null,amount:n(r.amount),outstandingAmount:n(r.outstanding_amount),state:r.state,dueAt:r.due_at ?? null,createdAt:r.created_at,updatedAt:r.updated_at}))
  }

  async listMatchFinancialEvents(clubId: UUID, limit = 50): Promise<MatchFinancialEvent[]> {
    const { data, error } = await this.client.from('match_financial_event').select('*').eq('club_id',clubId).order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,matchId:r.match_id,clubId:r.club_id,stadiumIncome:n(r.stadium_income),operatingCost:n(r.operating_cost),attendance:r.attendance===null?null:n(r.attendance),metadata:r.metadata ?? {},createdAt:r.created_at}))
  }
}
