import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiabilitiesClient } from '@/components/investments/liabilities-client'

export default async function PassivosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <LiabilitiesClient userId={user.id} />
}
