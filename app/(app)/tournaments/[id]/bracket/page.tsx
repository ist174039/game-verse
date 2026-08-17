import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BracketClient } from '@/components/tournaments/bracket-client'

export const dynamic = 'force-dynamic'

export default async function BracketPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: tournament } = await supabase
    .from('tournament')
    .select('id, name, format')
    .eq('id', id)
    .single()

  if (!tournament) return notFound()

  return (
    <BracketClient
      tournamentId={id}
      tournamentName={tournament.name}
    />
  )
}
