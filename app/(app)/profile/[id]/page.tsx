import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/profile-client'
import type { UserProfile, Club } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const [profileResult, clubResult] = await Promise.all([
    supabase.from('user_profile').select('*').eq('id', id).single(),
    supabase.from('club').select('*').eq('user_id', id).maybeSingle(),
  ])

  if (profileResult.error || !profileResult.data) return notFound()

  return (
    <ProfileClient
      profile={profileResult.data as UserProfile}
      legacyClub={clubResult.data as Club | null}
      isOwnProfile={user.id === id}
    />
  )
}
