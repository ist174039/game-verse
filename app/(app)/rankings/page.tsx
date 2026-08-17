import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RankingsHeader } from '@/components/rankings/rankings-header'
import { LeaderboardTable } from '@/components/rankings/leaderboard-table'
import { UserRankCard } from '@/components/rankings/user-rank-card'

export default async function RankingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from('user_profile')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get top players by ELO rating
  const { data: topPlayers } = await supabase
    .from('user_profile')
    .select('id, username, elo_rating, prestige_level, games_played_valid')
    .order('elo_rating', { ascending: false })
    .limit(50)

  // Calculate current user's rank
  const { count: usersAbove } = await supabase
    .from('user_profile')
    .select('*', { count: 'exact', head: true })
    .gt('elo_rating', currentProfile?.elo_rating || 0)

  const userRank = (usersAbove || 0) + 1

  return (
    <div className="space-y-6">
      <RankingsHeader />
      
      <UserRankCard 
        profile={currentProfile}
        rank={userRank}
      />

      <LeaderboardTable 
        players={topPlayers || []}
        currentUserId={user.id}
      />
    </div>
  )
}
