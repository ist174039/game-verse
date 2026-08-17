import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamManagementClient } from '@/components/team/team-management-client'

export const dynamic = 'force-dynamic'

export default async function TeamManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return <TeamManagementClient />
}
