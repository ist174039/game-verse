import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AssetsClient } from '@/components/investments/assets-client'

export default async function ActivosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <AssetsClient userId={user.id} />
}
