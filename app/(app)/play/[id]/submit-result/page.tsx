import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { SubmitResultClient } from '@/components/play/submit-result-client'

export const dynamic = 'force-dynamic'

export default async function SubmitResultPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ universe?: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const match = await services.competitions.getMatch(id)
  if (!match) return notFound()
  const requestedUniverse = (await searchParams).universe
  if (requestedUniverse && requestedUniverse !== match.universeId) return notFound()
  const ownClub = await services.clubs.getForUserInUniverse(user.id, match.universeId)
  if (!ownClub || ![match.homeClubId, match.awayClubId].includes(ownClub.id)) return notFound()
  if (!['READY','PLAYED'].includes(match.state)) redirect(`/play?universe=${match.universeId}`)

  const [homeClub, awayClub] = await Promise.all([services.clubs.getById(match.homeClubId), services.clubs.getById(match.awayClubId)])
  if (!homeClub || !awayClub) return notFound()

  return <SubmitResultClient matchId={match.id} userId={user.id} universeId={match.universeId} isHome={ownClub.id === match.homeClubId} homeClubName={homeClub.name} awayClubName={awayClub.name} />
}
