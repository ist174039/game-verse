import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Coins, Shield, UserCog, Users } from 'lucide-react'
import { getAdminSession, canAdmin } from '@/lib/server/admin-auth'
import { AdminFreezeButton } from '@/components/admin/admin-freeze-button'
import { AdminAccessManager, type AdminAccessCandidate } from '@/components/admin/admin-access-manager'

export const dynamic='force-dynamic'

export default async function AdminUsersPage(){
  const session=await getAdminSession()
  if(!session) redirect('/admin-access')

  const [profilesQ,clubsQ,userAccountsQ,clubAccountsQ,freezesQ,adminsQ]=await Promise.all([
    session.serviceClient.from('user_profile').select('*').order('created_at',{ascending:false}).limit(100),
    session.serviceClient.from('club').select('*').limit(1000),
    session.serviceClient.from('user_currency_account').select('user_id,currency,balance').limit(1000),
    session.serviceClient.from('club_currency_account').select('club_id,balance').limit(1000),
    session.serviceClient.from('economic_freeze').select('*').eq('scope','USER').eq('active',true),
    session.serviceClient.from('admin_user').select('user_id,role,active,created_at,updated_at').limit(1000),
  ])
  for(const q of[profilesQ,clubsQ,userAccountsQ,clubAccountsQ,freezesQ,adminsQ]) if(q.error) throw q.error

  const profiles=profilesQ.data??[]
  const clubs=clubsQ.data??[]
  const accounts=userAccountsQ.data??[]
  const clubSilver=new Map((clubAccountsQ.data??[]).map((row:any)=>[row.club_id,Number(row.balance)]))
  const freezes=new Map((freezesQ.data??[]).map((row:any)=>[row.user_id,row.id]))
  const adminMap=new Map((adminsQ.data??[]).map((row:any)=>[row.user_id,row]))
  const canFreeze=canAdmin(session.role,'FREEZE')
  const canManageAdmins=canAdmin(session.role,'ADMIN_USERS')

  let adminCandidates:AdminAccessCandidate[]=[]
  if(canManageAdmins){
    const authUsersResult=await session.serviceClient.auth.admin.listUsers({page:1,perPage:1000})
    if(authUsersResult.error) throw authUsersResult.error
    const profileMap=new Map(profiles.map((profile:any)=>[profile.id,profile]))
    adminCandidates=(authUsersResult.data.users??[]).map(user=>{
      const profile:any=profileMap.get(user.id)
      const admin:any=adminMap.get(user.id)
      return {
        id:user.id,
        email:user.email??'Sem email',
        username:profile?.username??user.email?.split('@')[0]??'Utilizador',
        role:admin?.role??null,
        active:Boolean(admin?.active),
        lastSignInAt:user.last_sign_in_at??null,
        createdAt:user.created_at??null,
        isSelf:user.id===session.user.id,
      }
    }).sort((a,b)=>Number(Boolean(b.role&&b.active))-Number(Boolean(a.role&&a.active))||a.email.localeCompare(b.email))
  }

  return <div className="space-y-7">
    <Header adminCount={(adminsQ.data??[]).filter((row:any)=>row.active).length}/>

    {canManageAdmins&&<AdminAccessManager users={adminCandidates} currentRole={session.role as any}/>} 

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Managers</p><h2 className="mt-1 text-xl font-black">Utilizadores & clubes</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Identidade global, economia e contexto operacional. Acesso Admin é separado do perfil de manager.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-white/[0.07] text-left text-[10px] uppercase tracking-[.13em] text-muted-foreground"><th className="pb-3">Manager</th><th className="pb-3">Clubes</th><th className="pb-3">Gold</th><th className="pb-3">Bronze</th><th className="pb-3">Reputação</th><th className="pb-3">Admin</th><th className="pb-3 text-right">Ações</th></tr></thead><tbody>{profiles.map((profile:any)=>{const userClubs=clubs.filter((club:any)=>club.user_id===profile.id);const gold=accounts.find((account:any)=>account.user_id===profile.id&&account.currency==='GOLD');const bronze=accounts.find((account:any)=>account.user_id===profile.id&&account.currency==='BRONZE');const admin:any=adminMap.get(profile.id);return <tr key={profile.id} className="border-b border-white/[0.05]"><td className="py-4"><p className="font-black">{profile.username}</p><p className="mt-1 text-xs text-muted-foreground">Lv.{profile.manager_level} · {profile.id}</p></td><td className="py-4"><p className="font-semibold">{userClubs.length}</p><p className="mt-1 text-xs text-muted-foreground">{userClubs.slice(0,2).map((club:any)=>`${club.name} (${(clubSilver.get(club.id)??0).toLocaleString('pt-PT')} S)`).join(' · ')||'—'}</p></td><td className="py-4 font-bold tabular-nums">{Number(gold?.balance??0).toLocaleString('pt-PT')}</td><td className="py-4 font-bold tabular-nums">{Number(bronze?.balance??0).toLocaleString('pt-PT')}</td><td className="py-4">{Number(profile.reputation).toLocaleString('pt-PT')}</td><td className="py-4">{admin?<span className={`text-[10px] font-bold uppercase tracking-[.1em] ${admin.active?'text-primary':'text-muted-foreground'}`}>{String(admin.role).replaceAll('_',' ')}{admin.active?'':' · off'}</span>:<span className="text-xs text-muted-foreground">—</span>}</td><td className="py-4 text-right">{canFreeze&&<AdminFreezeButton scope="USER" targetId={profile.id} freezeId={freezes.get(profile.id)??null}/>}</td></tr>})}</tbody></table></div>
      {profiles.length===0&&<div className="py-12 text-center text-sm text-muted-foreground">Ainda não existem managers com perfil.</div>}
    </section>
  </div>
}

function Header({adminCount}:{adminCount:number}){return <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><Link href="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5"/>Admin</Link><div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/><h1 className="text-2xl font-black">Utilizadores & Acessos</h1></div><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Shield className="h-3.5 w-3.5"/>RBAC persistido em admin_user</span><span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5"/>Gold/Bronze globais e Silver por clube</span></div></div><div className="rounded-xl border border-primary/12 bg-primary/[.025] px-4 py-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground"><UserCog className="h-3.5 w-3.5 text-primary"/>Admins ativos</p><p className="mt-1 text-2xl font-black text-primary">{adminCount}</p></div></div></section>}
