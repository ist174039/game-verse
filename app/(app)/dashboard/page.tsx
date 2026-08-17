import {createClient} from '@/lib/supabase/server'
import {createApplicationServices} from '@/lib/infrastructure/repositories/supabase/factory'
import {redirect} from 'next/navigation'
import {DashboardHeader} from '@/components/dashboard/dashboard-header'
import {DashboardUniverseSwitcher} from '@/components/dashboard/dashboard-universe-switcher'
import {DashboardCommandCenter} from '@/components/dashboard/dashboard-command-center'
import {StatsCards} from '@/components/dashboard/stats-cards'
import {ClubOverview} from '@/components/dashboard/club-overview'
import {RecentActivity} from '@/components/dashboard/recent-activity'
import {QuickActions} from '@/components/dashboard/quick-actions'

export const dynamic='force-dynamic'

export default async function DashboardPage({searchParams}:{searchParams:Promise<{universe?:string}>}){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user||user.is_anonymous)redirect('/auth/login')
  const services=createApplicationServices(supabase);const requestedUniverseId=(await searchParams).universe
  const directory=await services.reads.universeDirectory.load(user.id)
  const owned=[...directory.entries.filter(entry=>entry.club)].sort((a,b)=>Number(b.universe.kind==='MAIN')-Number(a.universe.kind==='MAIN'))
  const selected=(requestedUniverseId?owned.find(entry=>entry.universe.id===requestedUniverseId):null)??owned[0]??null
  if(!selected?.club)redirect('/onboarding')
  const dashboard=await services.reads.dashboard.load(user.id,selected.universe.id)
  if(!dashboard)redirect('/onboarding')

  return <div className="space-y-5 sm:space-y-6">
    <DashboardHeader username={dashboard.user.username||'Manager'} isNewUser={dashboard.user.managerXp===0}/>
    <DashboardUniverseSwitcher entries={directory.entries} activeUniverseId={dashboard.universe.id}/>
    <DashboardCommandCenter dashboard={dashboard}/>
    <ClubOverview club={dashboard.club} recentMatches={dashboard.recentMatches} universeName={dashboard.universe.name} universeId={dashboard.universe.id}/>
    <StatsCards silver={dashboard.currencies.silver} gold={dashboard.currencies.gold} bronze={dashboard.currencies.bronze} eloRating={dashboard.club.elo} prestigeScore={dashboard.club.prestige} gamesPlayed={dashboard.operational.settledMatches}/>
    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><div className="min-w-0"><RecentActivity articles={dashboard.communications.journal} notifications={dashboard.communications.notifications}/></div><div className="min-w-0"><QuickActions universeId={dashboard.universe.id}/></div></section>
  </div>
}
