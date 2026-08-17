import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrivateChatClient } from '@/components/community/private-chat-client'

export const dynamic = 'force-dynamic'

export default async function PrivateChatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('user_profile')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <PrivateChatClient
      userId={user.id}
      username={profile?.username || 'Manager'}
    />
  )
}
