import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { friend_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const friendId = typeof body.friend_id === 'string' ? body.friend_id : ''
  if (!UUID_RE.test(friendId)) return NextResponse.json({ error: 'invalid_friend_id' }, { status: 400 })

  const { data, error } = await supabase.rpc('remove_friendship', { p_other_user_id: friendId })
  if (error) return NextResponse.json({ error: 'friendship_remove_failed' }, { status: 400 })
  return NextResponse.json({ success: true, removed: data })
}
