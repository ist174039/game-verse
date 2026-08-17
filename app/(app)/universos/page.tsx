import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UniversosClient } from '@/components/universos/universos-client'

export default async function UniversosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <UniversosClient userId={user.id} />
}
