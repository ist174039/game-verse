import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/profile-client'
import type { UserProfile, Club, MatchWithPlayers } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const isOwnProfile = user.id === id

  // Fetch profile, club, friend status in parallel
  const [profileResult, clubResult, friendResult] = await Promise.all([
    supabase.from('user_profile').select('*').eq('id', id).single(),
    supabase.from('club').select('*').eq('user_id', id).single(),
    isOwnProfile
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from('friend')
          .select('*')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${user.id})`)
          .maybeSingle(),
  ])

  if (profileResult.error || !profileResult.data) return notFound()

  const profile = profileResult.data as UserProfile
  const club = clubResult.data as Club | null
  const friendship = friendResult?.data

  let friendStatus: 'none' | 'pending' | 'accepted' | 'blocked' = 'none'
  if (friendship) {
    if (friendship.status === 'accepted') friendStatus = 'accepted'
    else if (friendship.status === 'pending') friendStatus = 'pending'
    else if (friendship.status === 'blocked') friendStatus = 'blocked'
  }

  // H2H stats (only when viewing another user)
  let h2hStats: {
    userWins: number
    profileWins: number
    draws: number
    totalMatches: number
    lastMatch: string | null
    lastMatchScore: string | null
  } | null = null

  if (!isOwnProfile) {
    const { data: h2hMatches } = await supabase
      .from('match')
      .select('*')
      .or(`and(creator_id.eq.${user.id},opponent_id.eq.${id}),and(creator_id.eq.${id},opponent_id.eq.${user.id})`)
      .not('state', 'in', '("CREATED")')

    if (h2hMatches && h2hMatches.length > 0) {
      const userWins = h2hMatches.filter(m => m.winner_id === user.id).length
      const profileWins = h2hMatches.filter(m => m.winner_id === id).length
      const draws = h2hMatches.filter(m => m.winner_id === null && m.creator_score !== null).length

      const sorted = [...h2hMatches].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const last = sorted[0]
      const lastMatchScore = last
        ? `${last.creator_score ?? '?'}-${last.opponent_score ?? '?'}`
        : null
      const lastMatch = last
        ? getTimeAgoFromStr(last.created_at)
        : null

      h2hStats = {
        userWins,
        profileWins,
        draws,
        totalMatches: h2hMatches.length,
        lastMatch,
        lastMatchScore,
      }
    }
  }

  // Recent matches
  const { data: matches } = await supabase
    .from('match')
    .select('*, creator:creator_id(id, username, avatar_url, elo_rating), opponent:opponent_id(id, username, avatar_url, elo_rating)')
    .or(`creator_id.eq.${id},opponent_id.eq.${id}`)
    .not('state', 'in', '("CREATED")')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ProfileClient
        profile={profile}
        club={club}
        isOwnProfile={isOwnProfile}
        friendStatus={friendStatus}
        h2hStats={h2hStats}
        recentMatches={(matches || []) as unknown as MatchWithPlayers[]}
      />
    </div>
  )
}

function getTimeAgoFromStr(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}
