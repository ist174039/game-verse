import { redirect } from 'next/navigation'
import { AdminLoginClient } from '@/components/admin/admin-login-client'
import { AdminMfaClient } from '@/components/admin/admin-mfa-client'
import { getAdminIdentity, hasVerifiedAdminMfa } from '@/lib/server/admin-auth'

export const dynamic='force-dynamic'

export default async function AdminAccessPage(){
  const identity=await getAdminIdentity()
  if(!identity) return <AdminLoginClient />
  if(hasVerifiedAdminMfa(identity)) redirect('/admin')

  return <AdminMfaClient
    email={identity.user.email??'Administrador'}
    mode={identity.nextLevel==='aal2'?'challenge':'enroll'}
  />
}
