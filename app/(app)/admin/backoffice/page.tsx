import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BackofficeClient } from '@/components/backoffice/backoffice-client'

const BACKOFFICE_ROLES = new Set(['super_admin', 'platform_admin', 'economy_admin', 'competition_admin', 'moderator', 'support_agent', 'finance_operator'])

export default async function BackofficePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null
  if (!role || !BACKOFFICE_ROLES.has(role)) redirect('/dashboard')

  return <BackofficeClient />
}
