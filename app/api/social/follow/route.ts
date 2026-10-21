import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getActor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user: user && !user.is_anonymous ? user : null }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getActor()
  if (!user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { user_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const targetId = typeof body.user_id === 'string' ? body.user_id : ''
  if (!UUID_RE.test(targetId)) return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 })
  const { data, error } = await supabase.rpc('follow_player', { p_target_user_id: targetId })
  if (error) return NextResponse.json({ error: error.message.includes('user_not_found') ? 'user_not_found' : 'follow_failed' }, { status: error.message.includes('user_not_found') ? 404 : 400 })
  return NextResponse.json({ success: true, followed: data })
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getActor()
  if (!user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })
  let body: { user_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const targetId = typeof body.user_id === 'string' ? body.user_id : ''
  if (!UUID_RE.test(targetId)) return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 })
  const { data, error } = await supabase.rpc('unfollow_player', { p_target_user_id: targetId })
  if (error) return NextResponse.json({ error: 'unfollow_failed' }, { status: 400 })
  return NextResponse.json({ success: true, unfollowed: data })
}
