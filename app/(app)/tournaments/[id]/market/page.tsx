import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarketClient } from '@/components/tournament-market/market-client'

export default async function TournamentMarketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id } = await params

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single()

  return (
    <MarketClient
      tournamentId={id}
      tournamentName={tournament?.name ?? 'Tournament'}
      userId={user.id}
    />
  )
}
