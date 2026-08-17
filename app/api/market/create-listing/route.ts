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
    const { card_ownership_id, price, listing_type, auction_duration_hours } = body

    if (!card_ownership_id || !price || !listing_type) {
      return NextResponse.json({ error: 'card_ownership_id, price, listing_type required' }, { status: 400 })
    }

    if (!['direct', 'auction'].includes(listing_type)) {
      return NextResponse.json({ error: 'listing_type must be direct or auction' }, { status: 400 })
    }

    // Verify ownership
    const { data: ownership } = await supabase
      .from('card_ownership')
      .select('*')
      .eq('id', card_ownership_id)
      .eq('owner_id', user.id)
      .single()

    if (!ownership) {
      return NextResponse.json({ error: 'Card not found or not yours' }, { status: 404 })
    }

    if (ownership.is_listed) {
      return NextResponse.json({ error: 'Card is already listed' }, { status: 400 })
    }

    const auctionEndsAt = listing_type === 'auction' && auction_duration_hours
      ? new Date(Date.now() + auction_duration_hours * 3600000).toISOString()
      : null

    const { data: listing, error } = await supabase
      .from('market_listing')
      .insert({
        card_ownership_id,
        seller_id: user.id,
        price,
        listing_type,
        auction_ends_at: auctionEndsAt,
        status: 'active',
      })
      .select('*')
      .single()

    if (error) throw error

    await supabase.from('card_ownership').update({ is_listed: true }).eq('id', card_ownership_id)

    return NextResponse.json({ success: true, listing })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create listing'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
