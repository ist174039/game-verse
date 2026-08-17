import type { SupabaseClient } from '@supabase/supabase-js'
import type { RetentionRepository } from '@/lib/application/contracts'
import type { AchievementDefinition, BronzeStoreItem, DailyRewardClaim, MissionDefinition, UserAchievement, UserMission } from '@/lib/domain/retention'
import type { UUID } from '@/lib/domain/core'

const n = (v: unknown) => Number(v ?? 0)

export class SupabaseRetentionRepository implements RetentionRepository {
  constructor(private readonly client: SupabaseClient) {}
  async listActiveMissions(userId: UUID): Promise<Array<{ definition: MissionDefinition; progress: UserMission | null }>> {
    const { data: defs, error: defsError } = await this.client.from('mission_definition').select('*').eq('active', true)
    if (defsError) throw defsError
    const { data: progress, error: progressError } = await this.client.from('user_mission').select('*').eq('user_id', userId)
    if (progressError) throw progressError
    const byMission = new Map((progress ?? []).map((r:any)=>[r.mission_id,r]))
    return (defs ?? []).map((r:any)=>({definition:{id:r.id,code:r.code,title:r.title,description:r.description,cadence:r.cadence,target:n(r.target),rewardBronze:n(r.reward_bronze),rewardManagerXp:n(r.reward_manager_xp),active:Boolean(r.active)},progress:byMission.has(r.id)?(()=>{const p:any=byMission.get(r.id);return{id:p.id,userId:p.user_id,missionId:p.mission_id,periodKey:p.period_key,progress:n(p.progress),state:p.state,completedAt:p.completed_at,claimedAt:p.claimed_at}})():null}))
  }
  async claimDailyReward(): Promise<DailyRewardClaim> {
    const key = `daily:${new Date().toISOString().slice(0,10)}`
    const { data, error } = await this.client.rpc('claim_daily_reward',{p_idempotency_key:key})
    if (error) throw error
    return {id:data.id,userId:data.user_id,claimDate:data.claim_date,streak:n(data.streak),rewardBronze:n(data.reward_bronze),rewardManagerXp:n(data.reward_manager_xp),claimedAt:data.claimed_at}
  }
  async listAchievements(userId: UUID): Promise<Array<{ definition: AchievementDefinition; unlocked: UserAchievement | null }>> {
    const { data: defs, error: e1 } = await this.client.from('achievement_definition').select('*')
    if (e1) throw e1
    const { data: unlocked, error: e2 } = await this.client.from('user_achievement').select('*').eq('user_id',userId)
    if (e2) throw e2
    const byAchievement = new Map((unlocked ?? []).map((r:any)=>[r.achievement_id,r]))
    return (defs ?? []).map((r:any)=>({definition:{id:r.id,code:r.code,title:r.title,description:r.description,tier:r.tier,rewardBronze:n(r.reward_bronze),rewardManagerXp:n(r.reward_manager_xp)},unlocked:byAchievement.has(r.id)?(()=>{const u:any=byAchievement.get(r.id);return{id:u.id,userId:u.user_id,achievementId:u.achievement_id,unlockedAt:u.unlocked_at}})():null}))
  }
  async listBronzeStore(): Promise<BronzeStoreItem[]> {
    const { data, error } = await this.client.from('bronze_store_item').select('*').eq('active',true).order('price_bronze')
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,code:r.code,name:r.name,category:r.category,priceBronze:n(r.price_bronze),active:Boolean(r.active)}))
  }
}
