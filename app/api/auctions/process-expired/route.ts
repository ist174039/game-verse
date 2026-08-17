import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Processes expired auctions: finds winners, transfers cards, credits sellers.
 * Can be called by cron or manually by admin.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const MARKET_FEE = 0.05

    const { data: expiredListings } = await supabase
      .from('market_listing')
      .select('*')
      .eq('listing_type', 'auction')
      .eq('status', 'active')
      .lt('auction_ends_at', new Date().toISOString())

    let processed = 0

    for (const listing of expiredListings ?? []) {
      const { data: topBid } = await supabase
        .from('auction_bid')
        .select('*')
        .eq('listing_id', listing.id)
        .order('amount', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (topBid) {
        const fee = Math.round(topBid.amount * MARKET_FEE)
        const sellerReceives = topBid.amount - fee

        await supabase.from('market_listing').update({
          status: 'sold',
          buyer_id: topBid.bidder_id,
          sold_at: new Date().toISOString(),
          final_price: topBid.amount,
        }).eq('id', listing.id)

        await supabase.from('card_ownership').update({ owner_id: topBid.bidder_id, is_listed: false })
          .eq('id', listing.card_ownership_id)

        await supabase.rpc('credit_gc', {
          p_user_id: listing.seller_id,
          p_amount: sellerReceives,
          p_idempotency_key: `auction_sell_${listing.id}`,
        })
      } else {
        await supabase.from('market_listing').update({ status: 'expired' }).eq('id', listing.id)
      }
      processed++
    }

    return NextResponse.json({ success: true, processed })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process auctions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
