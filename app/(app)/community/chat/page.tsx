import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CommunityChatClient } from '@/components/community/community-chat-client'

export const dynamic = 'force-dynamic'

export default async function CommunityChatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('user_profile')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <CommunityChatClient
      userId={user.id}
      username={profile?.username || 'Manager'}
    />
  )
}
