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
    const { infrastructure_id, card_type } = body

    if (!infrastructure_id || !card_type) {
      return NextResponse.json({ error: 'infrastructure_id and card_type required' }, { status: 400 })
    }

    // Get current infra with club
    const { data: infra } = await supabase
      .from('club_infrastructure')
      .select('*, club!inner(*)')
      .eq('id', infrastructure_id)
      .eq('club.user_id', user.id)
      .single()

    if (!infra) {
      return NextResponse.json({ error: 'Infrastructure not found' }, { status: 404 })
    }

    const levelCost = infra.level * 500
    const { error: deductError } = await supabase.rpc('deduct_balance', {
      p_user_id: user.id,
      p_amount: levelCost,
      p_description: `Upgrade ${card_type} to level ${infra.level + 1}`,
    })

    if (deductError) {
      return NextResponse.json({ error: deductError.message || 'Insufficient balance or deduction failed' }, { status: 400 })
    }

    const levelBonus = 4 * (infra.level + 1) // 4% per level
    const { data: updated } = await supabase
      .from('club_infrastructure')
      .update({
        level: infra.level + 1,
        level_bonus: levelBonus,
        upgraded_at: new Date().toISOString(),
      })
      .eq('id', infrastructure_id)
      .select('*')
      .single()

    return NextResponse.json({ success: true, infrastructure: updated, cost: levelCost })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upgrade infrastructure'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
