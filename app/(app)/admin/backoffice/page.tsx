import { redirect } from 'next/navigation'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { getAdminSession } from '@/lib/server/admin-auth'
import { BackofficeClient } from '@/components/backoffice/backoffice-client'

export const dynamic='force-dynamic'

export default async function BackofficePage(){
  const session=await getAdminSession()
  if(!session) redirect('/dashboard')
  if(session.role==='read_only_analyst') redirect('/admin')
  const services=createAdminApplicationServices(session.userClient,session.serviceClient)
  const [tickets,cases]=await Promise.all([services.governance.listTickets(100),services.governance.listModerationCases(100)])
  return <BackofficeClient tickets={tickets} cases={cases} currentUserId={session.user.id} role={session.role}/>
}
