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

    const { data: result, error } = await supabase.rpc('buy_market_listing', {
      p_listing_id: listing_id,
      p_buyer_id: user.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const parsed = typeof result === 'string' ? JSON.parse(result) : result
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, transaction: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to buy listing'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
