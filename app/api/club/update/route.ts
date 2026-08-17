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
    const { name, motto, avatar_url, primary_color, secondary_color } = body

    const updates: Record<string, string> = {}
    if (name) updates.name = name
    if (motto !== undefined) updates.motto = motto
    if (avatar_url) updates.avatar_url = avatar_url
    if (primary_color) updates.primary_color = primary_color
    if (secondary_color) updates.secondary_color = secondary_color

    const { data: club } = await supabase
      .from('club')
      .update(updates)
      .eq('user_id', user.id)
      .select('*')
      .single()

    return NextResponse.json({ success: true, club })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update club'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
