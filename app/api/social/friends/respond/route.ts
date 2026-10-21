import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let body: { friendship_id?: unknown; action?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const requesterId = typeof body.friendship_id === 'string' ? body.friendship_id : ''
  if (!UUID_RE.test(requesterId) || !['accepted', 'rejected'].includes(String(body.action))) {
    return NextResponse.json({ error: 'friendship_id_and_action_required' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('respond_friendship', {
    p_requester_user_id: requesterId,
    p_accept: body.action === 'accepted',
  })
  if (error) {
    const missing = error.message.includes('friendship_request_not_found')
    return NextResponse.json({ error: missing ? 'friendship_request_not_found' : 'friendship_response_failed' }, { status: missing ? 404 : 400 })
  }
  return NextResponse.json({ success: true, friendship: data })
}
