import type { SupabaseClient } from '@supabase/supabase-js'
import type { RetentionRepository } from '@/lib/application/contracts'
import type { AchievementDefinition, BronzePurchase, BronzeStoreItem, DailyRewardClaim, MissionDefinition, UserAchievement, UserMission } from '@/lib/domain/retention'
import type { UUID } from '@/lib/domain/core'

const n=(v:unknown)=>Number(v??0)
const mapMission=(p:any):UserMission=>({id:p.id,userId:p.user_id,missionId:p.mission_id,periodKey:p.period_key,progress:n(p.progress),state:p.state,completedAt:p.completed_at,claimedAt:p.claimed_at})
const mapPurchase=(r:any):BronzePurchase=>({id:r.id,userId:r.user_id,itemId:r.item_id,priceBronze:n(r.price_bronze),ledgerTransactionId:r.ledger_transaction_id??null,purchasedAt:r.purchased_at})

export class SupabaseRetentionRepository implements RetentionRepository {
  constructor(private readonly client: SupabaseClient) {}
  async listActiveMissions(userId: UUID): Promise<Array<{ definition: MissionDefinition; progress: UserMission | null }>> {
    const {data:defs,error:defsError}=await this.client.from('mission_definition').select('*').eq('active',true).order('cadence').order('code')
    if(defsError)throw defsError
    const {data:progress,error:progressError}=await this.client.from('user_mission').select('*').eq('user_id',userId).order('period_key',{ascending:false})
    if(progressError)throw progressError
    const byMission=new Map<string,any>()
    for(const row of progress??[])if(!byMission.has(row.mission_id))byMission.set(row.mission_id,row)
    return (defs??[]).map((r:any)=>({definition:{id:r.id,code:r.code,title:r.title,description:r.description,cadence:r.cadence,target:n(r.target),rewardBronze:n(r.reward_bronze),rewardManagerXp:n(r.reward_manager_xp),active:Boolean(r.active)},progress:byMission.has(r.id)?mapMission(byMission.get(r.id)):null}))
  }
  async claimDailyReward(): Promise<DailyRewardClaim> {
    const {data,error}=await this.client.rpc('claim_daily_reward',{p_idempotency_key:crypto.randomUUID()})
    if(error)throw error
    return {id:data.id,userId:data.user_id,claimDate:data.claim_date,streak:n(data.streak),rewardBronze:n(data.reward_bronze),rewardManagerXp:n(data.reward_manager_xp),claimedAt:data.claimed_at}
  }
  async claimMission(userMissionId:UUID,idempotencyKey:string):Promise<UserMission>{
    const {data,error}=await this.client.rpc('claim_mission_reward',{p_user_mission_id:userMissionId,p_idempotency_key:idempotencyKey})
    if(error)throw error
    return mapMission(data)
  }
  async listAchievements(userId: UUID): Promise<Array<{ definition: AchievementDefinition; unlocked: UserAchievement | null }>> {
    const {data:defs,error:e1}=await this.client.from('achievement_definition').select('*').order('tier').order('code')
    if(e1)throw e1
    const {data:unlocked,error:e2}=await this.client.from('user_achievement').select('*').eq('user_id',userId)
    if(e2)throw e2
    const byAchievement=new Map((unlocked??[]).map((r:any)=>[r.achievement_id,r]))
    return (defs??[]).map((r:any)=>({definition:{id:r.id,code:r.code,title:r.title,description:r.description,tier:r.tier,rewardBronze:n(r.reward_bronze),rewardManagerXp:n(r.reward_manager_xp)},unlocked:byAchievement.has(r.id)?(()=>{const u:any=byAchievement.get(r.id);return{id:u.id,userId:u.user_id,achievementId:u.achievement_id,unlockedAt:u.unlocked_at}})():null}))
  }
  async listBronzeStore():Promise<BronzeStoreItem[]>{
    const {data,error}=await this.client.from('bronze_store_item').select('*').eq('active',true).order('price_bronze')
    if(error)throw error
    return (data??[]).map((r:any)=>({id:r.id,code:r.code,name:r.name,category:r.category,priceBronze:n(r.price_bronze),active:Boolean(r.active)}))
  }
  async listBronzePurchases(userId:UUID):Promise<BronzePurchase[]>{
    const {data,error}=await this.client.from('bronze_purchase').select('*').eq('user_id',userId).order('purchased_at',{ascending:false})
    if(error)throw error
    return (data??[]).map(mapPurchase)
  }
  async buyBronzeItem(itemId:UUID,idempotencyKey:string):Promise<BronzePurchase>{
    const {data,error}=await this.client.rpc('buy_bronze_item',{p_item_id:itemId,p_idempotency_key:idempotencyKey})
    if(error)throw error
    return mapPurchase(data)
  }
}
