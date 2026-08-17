import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ClubOverview } from '@/components/dashboard/club-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch dashboard data in parallel (first batch)
  const [profileResult, clubResult, walletResult, transactionsResult] = await Promise.all([
    supabase.from('user_profile').select('*').eq('id', user.id).single(),
    supabase.from('club').select('*').eq('user_id', user.id).single(),
    supabase.from('wallet').select('*').eq('user_id', user.id).single(),
    supabase.from('coin_transaction').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  // Fetch infrastructure after club data is available
  const infraResult = clubResult.data?.id 
    ? await supabase.from('club_infrastructure').select('*').eq('club_id', clubResult.data.id).limit(5)
    : { data: [] }

  const profile = profileResult.data
  const club = clubResult.data
  const wallet = walletResult.data
  const transactions = transactionsResult.data || []
  const infrastructure = infraResult.data || []

  return (
    <div className="space-y-6">
      <DashboardHeader 
        username={profile?.username || 'Manager'} 
        isNewUser={profile?.is_new_user || false}
      />
      
      <StatsCards 
        balance={wallet?.balance || 0}
        eloRating={profile?.elo_rating || 1200}
        prestigeLevel={profile?.prestige_level || 1}
        gamesPlayed={profile?.games_played_valid || 0}
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ClubOverview 
            club={club}
            infrastructure={infrastructure}
          />
          <RecentActivity transactions={transactions} />
        </div>
        
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
