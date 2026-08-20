import { notFound,redirect } from 'next/navigation'
import { canAdmin,getAdminSession } from '@/lib/server/admin-auth'
import { SupportTicketDetail } from '@/components/backoffice/support-ticket-detail'

export const dynamic='force-dynamic'

export default async function SupportTicketPage({params}:{params:Promise<{id:string}>}){
  const session=await getAdminSession();if(!session)redirect('/dashboard');if(!canAdmin(session.role,'TICKET'))redirect('/admin')
  const{id}=await params
  const ticketQ=await session.serviceClient.from('support_ticket').select('*').eq('id',id).maybeSingle()
  if(ticketQ.error)throw ticketQ.error;if(!ticketQ.data)notFound()
  const ticket=ticketQ.data as any
  const[notesQ,auditQ]=await Promise.all([
    session.serviceClient.from('ticket_note').select('*').eq('ticket_id',id).order('created_at',{ascending:true}),
    session.serviceClient.from('admin_audit_log').select('*').eq('ticket_id',id).order('created_at',{ascending:false}).limit(80),
  ])
  if(notesQ.error)throw notesQ.error;if(auditQ.error)throw auditQ.error
  let requester:any=null,club:any=null,universe:any=null
  if(ticket.requester_user_id){const q=await session.serviceClient.from('user_profile').select('id,username,avatar_url,reputation').eq('id',ticket.requester_user_id).maybeSingle();if(q.error)throw q.error;requester=q.data}
  if(ticket.club_id){const q=await session.serviceClient.from('club').select('id,name,logo_url,elo,prestige').eq('id',ticket.club_id).maybeSingle();if(q.error)throw q.error;club=q.data}
  if(ticket.universe_id){const q=await session.serviceClient.from('universe').select('id,name,kind,state').eq('id',ticket.universe_id).maybeSingle();if(q.error)throw q.error;universe=q.data}
  return <SupportTicketDetail ticket={ticket} notes={(notesQ.data??[]) as any[]} audit={(auditQ.data??[]) as any[]} requester={requester} club={club} universe={universe} currentUserId={session.user.id}/>
}
