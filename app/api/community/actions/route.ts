import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { readBoundedJson } from '@/lib/server/bounded-json'
import type { CommunityVisibility } from '@/lib/domain/social'

export const runtime = 'nodejs'

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const maxLengths = { name: 80, slug: 48, description: 500, post: 5000, message: 4000, username: 32 } as const

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  const parsed = await readBoundedJson<Record<string, unknown>>(request, 16 * 1024)
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason === 'too_large' ? 'request_too_large' : 'invalid_json' }, { status: 400 })

  const body = parsed.value
  const action = text(body.action)
  const services = createApplicationServices(supabase)
  try {
    if (action === 'create-community') {
      const name = text(body.name)
      const slug = text(body.slug).toLowerCase()
      const description = text(body.description)
      const visibility = text(body.visibility) as CommunityVisibility
      if (!name || name.length > maxLengths.name || !/^[a-z0-9-]{3,48}$/.test(slug) || description.length > maxLengths.description || !['PUBLIC', 'PRIVATE', 'INVITE_ONLY', 'APPROVAL_REQUIRED'].includes(visibility)) {
        return NextResponse.json({ error: 'invalid_community' }, { status: 400 })
      }
      const community = await services.social.createCommunity({ name, slug, description: description || null, visibility })
      return NextResponse.json({ community })
    }
    if (action === 'join-community') {
      const communityId = text(body.communityId)
      if (!communityId || communityId.length > 64) return NextResponse.json({ error: 'invalid_community_id' }, { status: 400 })
      const membership = await services.social.joinCommunity(communityId)
      return NextResponse.json({ membership })
    }
    if (action === 'create-post') {
      const communityId = text(body.communityId)
      const postBody = text(body.body)
      if (!communityId || communityId.length > 64 || postBody.length < 2 || postBody.length > maxLengths.post) return NextResponse.json({ error: 'invalid_post' }, { status: 400 })
      const post = await services.social.createPost({ communityId, body: postBody })
      return NextResponse.json({ post })
    }
    if (action === 'send-message') {
      const conversationId = text(body.conversationId)
      const message = text(body.body)
      if (!conversationId || conversationId.length > 64 || !message || message.length > maxLengths.message) return NextResponse.json({ error: 'invalid_message' }, { status: 400 })
      const result = await services.social.sendMessage({ conversationId, body: message })
      return NextResponse.json({ message: result })
    }
    if (action === 'start-direct') {
      const username = text(body.username)
      if (username.length < 2 || username.length > maxLengths.username) return NextResponse.json({ error: 'invalid_username' }, { status: 400 })
      const { data: profile, error } = await supabase.from('user_profile').select('id').eq('username', username).maybeSingle()
      if (error) throw error
      if (!profile) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
      const conversation = await services.social.startDirectConversation(profile.id)
      return NextResponse.json({ conversation })
    }
    return NextResponse.json({ error: 'unsupported_social_action' }, { status: 400 })
  } catch {
    // Database and service errors may contain query details or user supplied content.
    return NextResponse.json({ error: 'social_operation_failed' }, { status: 409 })
  }
}
