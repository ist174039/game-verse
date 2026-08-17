import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await req.json()
    const { listing_type, rarity_filters, min_price, max_price, sort_by } = body

    let query = supabase
      .from('market_listing')
      .select('*, seller:club!seller_id(name, avatar_url, prestige_level), card:card_ownership!card_ownership_id(card:card_id(*))')
      .eq('status', 'active')

    if (listing_type) query = query.eq('listing_type', listing_type)
    if (rarity_filters?.length) query = query.in('card_ownership.card.rarity', rarity_filters)
    if (min_price) query = query.gte('price', min_price)
    if (max_price) query = query.lte('price', max_price)

    const order = sort_by === 'price_asc' ? { ascending: true } :
                  sort_by === 'price_desc' ? { ascending: false } :
                  { ascending: false }

    const { data: listings, error } = await query.order('created_at', order)

    if (error) throw error

    return NextResponse.json({ success: true, listings })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch listings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
