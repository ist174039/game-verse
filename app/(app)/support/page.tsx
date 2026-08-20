import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SupportClient } from '@/components/support/support-client'

export const dynamic='force-dynamic'

export default async function SupportPage(){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect('/auth/login')
  const[ticketsQ,clubsQ]=await Promise.all([
    supabase.from('support_ticket').select('*').order('updated_at',{ascending:false}).limit(100),
    supabase.from('club').select('id,name,universe_id').eq('user_id',user.id).order('name'),
  ])
  if(ticketsQ.error)throw ticketsQ.error;if(clubsQ.error)throw clubsQ.error
  const tickets=ticketsQ.data??[],ids=tickets.map((ticket:any)=>ticket.id)
  const notesQ=ids.length?await supabase.from('ticket_note').select('*').in('ticket_id',ids).eq('internal',false).order('created_at',{ascending:true}):{data:[],error:null}
  if(notesQ.error)throw notesQ.error
  return <SupportClient userId={user.id} tickets={tickets as any[]} notes={(notesQ.data??[]) as any[]} clubs={(clubsQ.data??[]) as any[]}/>
}
