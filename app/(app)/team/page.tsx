import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { resolveOwnedUniverseContext, onboardingHref } from '@/lib/server/active-universe'
import { redirect } from 'next/navigation'
import { TeamManagementClient } from '@/components/team/team-management-client'

export const dynamic = 'force-dynamic'

export default async function TeamManagementPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const { selected, onboardingUniverseId } = resolveOwnedUniverseContext(directory.entries, requestedUniverseId)
  if (onboardingUniverseId) redirect(onboardingHref(onboardingUniverseId))
  if (!selected?.club) redirect('/onboarding')
  const squad = await services.reads.squad.load(user.id, selected.universe.id)
  if (!squad) redirect(onboardingHref(selected.universe.id))
  return <TeamManagementClient squad={squad} />
}
