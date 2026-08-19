import { redirect } from 'next/navigation'
import { AdminLoginClient } from '@/components/admin/admin-login-client'
import { getAdminSession } from '@/lib/server/admin-auth'

export const dynamic='force-dynamic'

export default async function AdminAccessPage(){
  const session=await getAdminSession()
  if(session) redirect('/admin')
  return <AdminLoginClient />
}
