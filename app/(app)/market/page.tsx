import { createClient } from '@/lib/supabase/server'
import { MarketPageClient } from '@/components/market/market-page-client'
import type { MarketListingWithSeller } from '@/lib/types'

export default async function MarketPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: listings }, { data: wallet }] = await Promise.all([
    supabase
      .from('market_listing')
      .select('*, seller:seller_id(id, username, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase.from('wallet').select('balance').eq('user_id', user.id).single(),
  ])

  return (
    <MarketPageClient
      listings={(listings || []) as unknown as MarketListingWithSeller[]}
      userId={user.id}
      balance={wallet?.balance || 0}
    />
  )
}
