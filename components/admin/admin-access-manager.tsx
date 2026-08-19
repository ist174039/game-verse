'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShieldCheck, ShieldOff, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Role='super_admin'|'platform_admin'|'economy_admin'|'competition_admin'|'moderator'|'support_agent'|'finance_operator'|'read_only_analyst'

export interface AdminAccessCandidate {
  id:string
  email:string
  username:string
  role:Role|null
  active:boolean
  lastSignInAt:string|null
  createdAt:string|null
  isSelf:boolean
}

const ROLES:Role[]=['super_admin','platform_admin','economy_admin','competition_admin','moderator','support_agent','finance_operator','read_only_analyst']
const LABELS:Record<Role,string>={
  super_admin:'Super Admin',
  platform_admin:'Platform Admin',
  economy_admin:'Economy Admin',
  competition_admin:'Competition Admin',
  moderator:'Moderator',
  support_agent:'Support Agent',
  finance_operator:'Finance Operator',
  read_only_analyst:'Read-only Analyst',
}

function friendlyError(message:string){
  if(message.includes('last_super_admin_protected')) return 'Não podes desativar ou despromover o último Super Admin ativo.'
  if(message.includes('super_admin_assignment_forbidden')) return 'Apenas um Super Admin pode atribuir a role Super Admin.'
  if(message.includes('admin_management_forbidden')) return 'A tua role não permite gerir administradores.'
  if(message.includes('auth_user_not_found')) return 'O utilizador já não existe no Supabase Auth.'
  return message
}

export function AdminAccessManager({users,currentRole}:{users:AdminAccessCandidate[];currentRole:Role}){
  const router=useRouter()
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState<AdminAccessCandidate|null>(null)
  const [role,setRole]=useState<Role>('platform_admin')
  const [active,setActive]=useState(true)
  const [reason,setReason]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase()
    if(!q) return users
    return users.filter(user=>[user.email,user.username,user.role??''].some(value=>value.toLowerCase().includes(q)))
  },[query,users])

  function open(user:AdminAccessCandidate){
    setSelected(user)
    setRole(user.role??'platform_admin')
    setActive(user.role?user.active:true)
    setReason('')
    setError(null)
  }

  async function save(){
    if(!selected) return
    if(reason.trim().length<5){setError('Indica um motivo com pelo menos 5 caracteres.');return}
    setLoading(true);setError(null)
    try{
      const response=await fetch('/api/admin/users/access',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({userId:selected.id,role,active,reason:reason.trim()}),
      })
      const payload=await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.error||'admin_access_update_failed')
      setSelected(null)
      router.refresh()
    }catch(cause){setError(friendlyError(cause instanceof Error?cause.message:'Não foi possível atualizar o acesso.'))}
    finally{setLoading(false)}
  }

  return <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="flex items-center gap-2"><UserCog className="h-5 w-5 text-primary"/><h2 className="text-xl font-black">Acesso administrativo</h2></div><p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">A autorização vem de <code className="text-foreground">admin_user</code>. Todas as alterações exigem motivo e ficam no audit log.</p></div>
      <div className="relative w-full lg:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Procurar email, nome ou role" className="pl-9"/></div>
    </div>

    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b border-white/[0.07] text-left text-[10px] uppercase tracking-[.13em] text-muted-foreground"><th className="pb-3">Utilizador</th><th className="pb-3">Role</th><th className="pb-3">Estado</th><th className="pb-3">Último login</th><th className="pb-3 text-right">Ação</th></tr></thead><tbody>{filtered.map(user=><tr key={user.id} className="border-b border-white/[0.05]"><td className="py-4"><p className="font-black">{user.username}{user.isSelf&&<span className="ml-2 text-[9px] uppercase tracking-[.12em] text-primary">tu</span>}</p><p className="mt-1 text-xs text-muted-foreground">{user.email}</p></td><td className="py-4">{user.role?<span className="rounded-full border border-primary/15 bg-primary/[.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-primary">{LABELS[user.role]}</span>:<span className="text-xs text-muted-foreground">Manager</span>}</td><td className="py-4">{user.role?(user.active?<span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400"><ShieldCheck className="h-3.5 w-3.5"/>Ativo</span>:<span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><ShieldOff className="h-3.5 w-3.5"/>Desativado</span>):<span className="text-xs text-muted-foreground">Sem acesso Admin</span>}</td><td className="py-4 text-xs text-muted-foreground">{user.lastSignInAt?new Date(user.lastSignInAt).toLocaleString('pt-PT'):'—'}</td><td className="py-4 text-right"><Button size="sm" variant="outline" onClick={()=>open(user)}>Gerir acesso</Button></td></tr>)}</tbody></table></div>

    {filtered.length===0&&<div className="py-10 text-center text-sm text-muted-foreground">Nenhum utilizador corresponde à pesquisa.</div>}

    <Dialog open={Boolean(selected)} onOpenChange={value=>{if(!value&&!loading)setSelected(null)}}>
      <DialogContent>
        <DialogHeader><DialogTitle>Gerir acesso administrativo</DialogTitle><DialogDescription>{selected?`${selected.username} · ${selected.email}`:''}</DialogDescription></DialogHeader>
        <DialogBody><div className="grid gap-4">
          <div><label className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Role</label><select value={role} onChange={event=>setRole(event.target.value as Role)} className="mt-2 h-10 w-full rounded-md border border-white/[0.08] bg-[#090909] px-3 text-sm outline-none focus:border-primary/40">{ROLES.filter(item=>currentRole==='super_admin'||item!=='super_admin').map(item=><option key={item} value={item}>{LABELS[item]}</option>)}</select></div>
          <button type="button" onClick={()=>setActive(value=>!value)} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${active?'border-primary/20 bg-primary/[.035]':'border-white/[0.07] bg-white/[.015]'}`}><div><p className="text-sm font-black">Acesso ativo</p><p className="mt-1 text-xs text-muted-foreground">Quando desativado, a conta continua no Auth mas perde acesso imediato ao Admin.</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${active?'bg-primary/10 text-primary':'bg-white/[.05] text-muted-foreground'}`}>{active?'ON':'OFF'}</span></button>
          <div><label className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Motivo obrigatório</label><Input value={reason} onChange={event=>setReason(event.target.value)} placeholder="Ex.: atribuição de responsabilidade de competição" className="mt-2"/></div>
          {error&&<p className="rounded-lg border border-destructive/20 bg-destructive/[.05] p-3 text-xs text-destructive">{error}</p>}
        </div></DialogBody>
        <DialogFooter><Button variant="outline" onClick={()=>setSelected(null)} disabled={loading}>Cancelar</Button><Button onClick={save} disabled={loading}>{loading?'A guardar…':'Guardar acesso'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
}
