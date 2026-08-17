import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminPanelClient } from '@/components/admin/admin-panel-client'

const ADMIN_ROLES = new Set(['super_admin', 'platform_admin', 'economy_admin', 'competition_admin', 'moderator', 'support_agent', 'finance_operator', 'read_only_analyst'])

export default async function AdminPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null
  if (!role || !ADMIN_ROLES.has(role)) redirect('/dashboard')

  return <AdminPanelClient role={role} />
}
