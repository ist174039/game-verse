import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clearPublicImage, readOptionalImage, replacePublicImage } from '@/lib/server/media-storage'

function responseError(error: unknown) {
  const message = error instanceof Error ? error.message : 'profile_update_failed'
  if (message.includes('duplicate key') || message.includes('23505')) return 'username_taken'
  return message
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let formData: FormData
  try { formData = await request.formData() } catch { return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 }) }

  const username = String(formData.get('username') ?? '').trim().replace(/\s+/g, ' ')
  if (username.length < 3 || username.length > 32) return NextResponse.json({ error: 'invalid_username' }, { status: 400 })

  try {
    const [profileQ, duplicateQ] = await Promise.all([
      supabase.from('user_profile').select('username,avatar_url').eq('id', user.id).maybeSingle(),
      supabase.from('user_profile').select('id').eq('username', username).neq('id', user.id).limit(1),
    ])
    if (profileQ.error) throw profileQ.error
    if (duplicateQ.error) throw duplicateQ.error
    if (!profileQ.data) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
    if ((duplicateQ.data ?? []).length > 0) return NextResponse.json({ error: 'username_taken' }, { status: 409 })

    const image = await readOptionalImage(formData, 'avatar')
    const removeAvatar = String(formData.get('removeAvatar') ?? '') === 'true'
    if (image && removeAvatar) return NextResponse.json({ error: 'conflicting_avatar_action' }, { status: 400 })

    let avatarUrl: string | null = profileQ.data.avatar_url ?? null
    if (removeAvatar) {
      await clearPublicImage(supabase, { bucket: 'avatars', folder: user.id, basename: 'avatar' })
      avatarUrl = null
    } else if (image) {
      avatarUrl = await replacePublicImage(supabase, { bucket: 'avatars', folder: user.id, basename: 'avatar', image })
    }

    const { error } = await supabase.from('user_profile').update({ username, avatar_url: avatarUrl }).eq('id', user.id)
    if (error) throw error
    return NextResponse.json({ username, avatarUrl })
  } catch (error) {
    return NextResponse.json({ error: responseError(error) }, { status: 409 })
  }
}
