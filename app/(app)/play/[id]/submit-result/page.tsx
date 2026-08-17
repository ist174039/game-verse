import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubmitResultClient } from '@/components/play/submit-result-client'
import type { MatchWithPlayers } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SubmitResultPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: match } = await supabase
    .from('match')
    .select('*, creator:creator_id(id, username, avatar_url, elo_rating), opponent:opponent_id(id, username, avatar_url, elo_rating)')
    .eq('id', id)
    .single()

  if (!match) return notFound()

  const matchWithPlayers = match as unknown as MatchWithPlayers
  const isCreator = match.creator_id === user.id
  const isParticipant = isCreator || match.opponent_id === user.id
  if (!isParticipant) return notFound()

  const opponentName = isCreator
    ? matchWithPlayers.opponent?.username || 'Opponent'
    : matchWithPlayers.creator?.username || 'Opponent'

  return (
    <SubmitResultClient
      matchId={id}
      userId={user.id}
      isCreator={isCreator}
      opponentName={opponentName}
    />
  )
}
