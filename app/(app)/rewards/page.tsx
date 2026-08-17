import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { RewardsClient } from '@/components/rewards/rewards-client'

export const dynamic='force-dynamic'

export default async function RewardsPage(){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user||user.is_anonymous)redirect('/auth/login')
  const services=createApplicationServices(supabase)
  const [missions,achievements,store,purchases,balanceQ,todayQ,statQ,profileQ]=await Promise.all([
    services.retention.listActiveMissions(user.id),services.retention.listAchievements(user.id),services.retention.listBronzeStore(),services.retention.listBronzePurchases(user.id),
    supabase.from('user_currency_account').select('balance').eq('user_id',user.id).eq('currency','BRONZE').maybeSingle(),
    supabase.from('daily_reward_claim').select('*').eq('user_id',user.id).eq('claim_date',new Date().toISOString().slice(0,10)).maybeSingle(),
    supabase.from('user_engagement_stat').select('*').eq('user_id',user.id).maybeSingle(),
    supabase.from('user_profile').select('manager_level,manager_xp').eq('id',user.id).maybeSingle(),
  ])
  for(const q of[balanceQ,todayQ,statQ,profileQ])if(q.error)throw q.error
  return <RewardsClient bronzeBalance={Number(balanceQ.data?.balance??0)} managerLevel={Number(profileQ.data?.manager_level??1)} managerXp={Number(profileQ.data?.manager_xp??0)} todayClaim={todayQ.data?{streak:Number(todayQ.data.streak),rewardBronze:Number(todayQ.data.reward_bronze),rewardManagerXp:Number(todayQ.data.reward_manager_xp),claimedAt:todayQ.data.claimed_at}:null} missions={missions} achievements={achievements} store={store} ownedItemIds={purchases.map(p=>p.itemId)} stats={{matchesPlayed:Number(statQ.data?.matches_played??0),wins:Number(statQ.data?.wins??0),transfers:Number(statQ.data?.transfers??0),communityPosts:Number(statQ.data?.community_posts??0),bestDailyStreak:Number(statQ.data?.best_daily_streak??0)}}/>
}
