import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { redirect } from 'next/navigation'
import { MarketPageClient } from '@/components/market/market-page-client'

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const selected = (requestedUniverseId ? directory.entries.find(entry => entry.universe.id === requestedUniverseId && entry.club) : null)
    ?? directory.entries.find(entry => entry.club)
  if (!selected?.club) redirect('/onboarding')

  const market = await services.reads.market.load(user.id, selected.universe.id)
  if (!market) redirect('/onboarding')

  return <MarketPageClient market={market} />
}
