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
    const { listing_id } = body

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
    }

    const { data: listing } = await supabase
      .from('market_listing')
      .select('*, card_ownership!inner(*)')
      .eq('id', listing_id)
      .eq('seller_id', user.id)
      .in('status', ['active', 'pending'])
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found or not yours' }, { status: 404 })
    }

    await supabase.from('market_listing').update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    }).eq('id', listing_id)

    await supabase.from('card_ownership').update({ is_listed: false }).eq('id', listing.card_ownership_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel listing'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
