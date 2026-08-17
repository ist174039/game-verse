import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TournamentDetailClient } from '@/components/tournaments/tournament-detail-client'
import type { Tournament, TournamentMatch } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TournamentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: tournament } = await supabase
    .from('tournament')
    .select('*')
    .eq('id', id)
    .single()

  if (!tournament) return notFound()

  const [walletResult, matchesResult, regResult] = await Promise.all([
    supabase.from('wallet').select('balance').eq('user_id', user.id).single(),
    supabase
      .from('tournament_match')
      .select('*')
      .eq('tournament_id', id)
      .order('round', { ascending: true })
      .order('match_index', { ascending: true }),
    supabase
      .from('tournament_registration')
      .select('id')
      .eq('tournament_id', id)
      .eq('user_id', user.id)
      .single(),
  ])

  return (
    <TournamentDetailClient
      tournament={tournament as unknown as Tournament}
      tournamentMatches={(matchesResult.data || []) as unknown as TournamentMatch[]}
      userId={user.id}
      isRegistered={!!regResult.data}
      balance={walletResult.data?.balance || 0}
    />
  )
}
