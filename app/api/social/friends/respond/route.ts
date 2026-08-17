import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { friendship_id, action } = body

    if (!friendship_id || !['accepted', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'friendship_id and action (accepted|rejected) required' }, { status: 400 })
    }

    const { data: friendship } = await supabase
      .from('friendship')
      .select('*')
      .eq('id', friendship_id)
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .single()

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship request not found' }, { status: 404 })
    }

    await supabase
      .from('friendship')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', friendship_id)

    if (action === 'accepted') {
      // Send notification to requester
      await supabase.from('notification').insert({
        user_id: friendship.user_id,
        type: 'friend_accepted',
        title: 'Pedido Aceite ✅',
        body: 'O teu pedido de amizade foi aceite!',
        data: { friendship_id },
      })
    }

    return NextResponse.json({ success: true, status: action })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to respond'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
