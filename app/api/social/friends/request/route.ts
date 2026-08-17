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
    const { friend_id } = body

    if (!friend_id) {
      return NextResponse.json({ error: 'friend_id required' }, { status: 400 })
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendship')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already friends or request pending' }, { status: 400 })
    }

    const { data: friendship, error } = await supabase
      .from('friendship')
      .insert({
        user_id: user.id,
        friend_id,
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) throw error

    // Send notification
    await supabase.from('notification').insert({
      user_id: friend_id,
      type: 'friend_request',
      title: 'Pedido de Amizade',
      body: 'Alguém quer ser teu amigo!',
      data: { from_user_id: user.id },
    })

    return NextResponse.json({ success: true, friendship })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send friend request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
