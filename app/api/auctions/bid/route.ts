import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { listing_id, amount } = body

    if (!listing_id || !amount) {
      return NextResponse.json({ error: 'listing_id and amount required' }, { status: 400 })
    }

    if (amount < 1) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    const { data: listing } = await supabase
      .from('market_listing')
      .select('*')
      .eq('id', listing_id)
      .eq('listing_type', 'auction')
      .eq('status', 'active')
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Auction not found or not active' }, { status: 404 })
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'Cannot bid on your own auction' }, { status: 400 })
    }

    // Check minimum bid
    const { data: topBid } = await supabase
      .from('auction_bid')
      .select('amount')
      .eq('listing_id', listing_id)
      .order('amount', { ascending: false })
      .limit(1)
      .maybeSingle()

    const minBid = Math.max(listing.price, (topBid?.amount ?? 0) + 1)
    if (amount < minBid) {
      return NextResponse.json({ error: `Minimum bid is ${minBid} GC` }, { status: 400 })
    }

    const { data: bid, error } = await supabase
      .from('auction_bid')
      .insert({
        listing_id,
        bidder_id: user.id,
        amount,
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, bid })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to place bid'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
