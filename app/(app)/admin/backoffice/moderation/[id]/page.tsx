import { notFound,redirect } from 'next/navigation'
import { canAdmin,getAdminSession } from '@/lib/server/admin-auth'
import { ModerationCaseDetail } from '@/components/backoffice/moderation-case-detail'

export const dynamic='force-dynamic'

export default async function ModerationCasePage({params}:{params:Promise<{id:string}>}){
  const session=await getAdminSession();if(!session)redirect('/dashboard');if(!canAdmin(session.role,'MODERATION'))redirect('/admin')
  const{id}=await params
  const caseQ=await session.serviceClient.from('moderation_case').select('*').eq('id',id).maybeSingle();if(caseQ.error)throw caseQ.error;if(!caseQ.data)notFound()
  const item=caseQ.data as any
  const[freezesQ,auditQ]=await Promise.all([
    session.serviceClient.from('economic_freeze').select('*').eq('case_id',id).order('created_at',{ascending:false}),
    session.serviceClient.from('admin_audit_log').select('*').eq('target_type','MODERATION_CASE').eq('target_id',id).order('created_at',{ascending:false}).limit(100),
  ])
  if(freezesQ.error)throw freezesQ.error;if(auditQ.error)throw auditQ.error
  let targetUser:any=null,targetClub:any=null,targetUniverse:any=null,targetMatch:any=null
  if(item.target_user_id){const q=await session.serviceClient.from('user_profile').select('id,username,avatar_url,reputation').eq('id',item.target_user_id).maybeSingle();if(q.error)throw q.error;targetUser=q.data}
  if(item.target_club_id){const q=await session.serviceClient.from('club').select('id,name,logo_url,elo,prestige,user_id').eq('id',item.target_club_id).maybeSingle();if(q.error)throw q.error;targetClub=q.data}
  if(item.target_universe_id){const q=await session.serviceClient.from('universe').select('id,name,kind,state').eq('id',item.target_universe_id).maybeSingle();if(q.error)throw q.error;targetUniverse=q.data}
  if(item.match_id){const q=await session.serviceClient.from('match').select('id,state,home_club_id,away_club_id,home_score,away_score').eq('id',item.match_id).maybeSingle();if(q.error)throw q.error;targetMatch=q.data}
  return <ModerationCaseDetail item={item} freezes={(freezesQ.data??[]) as any[]} audit={(auditQ.data??[]) as any[]} targetUser={targetUser} targetClub={targetClub} targetUniverse={targetUniverse} targetMatch={targetMatch} currentUserId={session.user.id} canFreeze={canAdmin(session.role,'FREEZE')}/>
}
