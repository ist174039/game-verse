import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ClubOverview } from '@/components/dashboard/club-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const universes = await services.universes.listAvailable(user.id)
  const ordered = [...universes].sort((a,b) => Number(b.kind === 'MAIN') - Number(a.kind === 'MAIN'))

  let activeUniverse = null
  for (const universe of ordered) {
    const club = await services.clubs.getForUserInUniverse(user.id, universe.id)
    if (club) { activeUniverse = universe; break }
  }
  if (!activeUniverse) redirect('/universos')

  const dashboard = await services.reads.dashboard.load(user.id, activeUniverse.id)
  if (!dashboard) redirect('/universos')

  const ownStanding = dashboard.standings.find(row => row.clubId === dashboard.club.id)
  const gamesPlayed = ownStanding?.played ?? dashboard.recentMatches.length

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardHeader username={dashboard.user.username || 'Manager'} isNewUser={dashboard.user.managerXp === 0} />

      <ClubOverview club={dashboard.club} recentMatches={dashboard.recentMatches} universeName={dashboard.universe.name} />

      <StatsCards
        silver={dashboard.currencies.silver}
        gold={dashboard.currencies.gold}
        bronze={dashboard.currencies.bronze}
        eloRating={dashboard.club.elo}
        prestigeScore={dashboard.club.prestige}
        gamesPlayed={gamesPlayed}
      />

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="min-w-0">
          <RecentActivity articles={dashboard.communications.journal} />
        </div>
        <div className="min-w-0">
          <QuickActions />
        </div>
      </section>
    </div>
  )
}
