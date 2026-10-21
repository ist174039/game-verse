import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'cache-control': 'no-store' } })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: { 'cache-control': 'no-store' } })
  }

  const notificationId = typeof body === 'object' && body !== null && 'notificationId' in body
    ? (body as { notificationId?: unknown }).notificationId
    : null
  if (typeof notificationId !== 'string' || !UUID.test(notificationId)) {
    return NextResponse.json({ error: 'invalid_notification_id' }, { status: 400, headers: { 'cache-control': 'no-store' } })
  }

  const { error } = await supabase
    .from('notification')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) return NextResponse.json({ error: 'notification_update_failed' }, { status: 500, headers: { 'cache-control': 'no-store' } })
  return NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } })
}
