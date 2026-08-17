import { createClient } from '@/lib/supabase/server'
import { SocialPageClient } from '@/components/social/social-page-client'
import type { FriendWithProfile, ActivityWithUser } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SocialPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: friendsData },
    { data: pendingData },
    { data: activitiesData },
  ] = await Promise.all([
    supabase
      .from('friend')
      .select('*, friend:friend_id(id, username, avatar_url, elo_rating, prestige_level)')
      .eq('user_id', user.id)
      .eq('status', 'accepted'),
    supabase
      .from('friend')
      .select('*, friend:user_id(id, username, avatar_url, elo_rating, prestige_level)')
      .eq('friend_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('activity')
      .select('*, user:user_id(id, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <SocialPageClient
      friends={(friendsData || []) as unknown as FriendWithProfile[]}
      pendingRequests={(pendingData || []) as unknown as FriendWithProfile[]}
      activities={(activitiesData || []) as unknown as ActivityWithUser[]}
      userId={user.id}
    />
  )
}
