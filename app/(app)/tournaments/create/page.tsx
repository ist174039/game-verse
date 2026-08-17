import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateTournamentClient } from '@/components/tournaments/create-tournament-client'

export const dynamic = 'force-dynamic'

export default async function CreateTournamentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('user_profile')
    .select('id, username')
    .eq('id', user.id)
    .single()

  return (
    <CreateTournamentClient
      userId={user.id}
      username={profile?.username || 'Manager'}
    />
  )
}
