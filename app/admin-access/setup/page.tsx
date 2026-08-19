import { redirect } from 'next/navigation'
import { AdminBootstrapClient } from '@/components/admin/admin-bootstrap-client'
import { getAdminIdentity } from '@/lib/server/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminSetupPage() {
  const identity = await getAdminIdentity()
  if (identity) redirect('/admin-access')

  return <AdminBootstrapClient />
}
