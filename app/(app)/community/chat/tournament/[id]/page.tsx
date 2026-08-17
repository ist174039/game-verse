import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TournamentChatClient } from '@/components/community/tournament-chat-client'

export const dynamic = 'force-dynamic'

export default async function TournamentChatPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const [profileResult, tournamentResult] = await Promise.all([
    supabase.from('user_profile').select('id, username, avatar_url').eq('id', user.id).single(),
    supabase.from('tournament').select('id, name').eq('id', id).single(),
  ])

  if (!tournamentResult.data) return notFound()

  return (
    <TournamentChatClient
      tournamentId={id}
      tournamentName={tournamentResult.data.name}
      userId={user.id}
      username={profileResult.data?.username || 'Manager'}
    />
  )
}
