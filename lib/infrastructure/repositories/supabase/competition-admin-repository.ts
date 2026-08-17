import type { SupabaseClient } from '@supabase/supabase-js'
import type { CompetitionAdminRepository } from '@/lib/application/admin-contracts'

export class SupabaseCompetitionAdminRepository implements CompetitionAdminRepository {
  constructor(private readonly client:SupabaseClient){}
  async activate(input:{competitionId:string;actorUserId:string;startsAt?:string|null;roundIntervalDays?:number}):Promise<Record<string,unknown>>{
    const {data,error}=await this.client.rpc('service_activate_competition',{p_competition_id:input.competitionId,p_actor_user_id:input.actorUserId,p_starts_at:input.startsAt??new Date().toISOString(),p_round_interval_days:input.roundIntervalDays??7})
    if(error)throw error
    return data??{}
  }
  async progress(input:{competitionId:string;actorUserId:string}):Promise<Record<string,unknown>>{
    const {data,error}=await this.client.rpc('service_progress_competition',{p_competition_id:input.competitionId,p_actor_user_id:input.actorUserId})
    if(error)throw error
    return data??{}
  }
}
