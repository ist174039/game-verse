import { createClient } from '@/lib/supabase/server'
import { AuctionPageClient } from '@/components/market/auction-client'

export default async function AuctionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: wallet } = await supabase
    .from('wallet')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const balance = wallet?.balance || 0

  // Mock escrow amount — in production, sum from auction_escrow table
  const escrowAmount = Math.round(balance * 0.15)

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      <AuctionPageClient balance={balance} escrowAmount={escrowAmount} />
    </div>
  )
}
