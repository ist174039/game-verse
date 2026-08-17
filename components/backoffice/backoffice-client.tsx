'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FileText, Headphones, ShieldAlert, Tickets, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { InternalRole, ModerationCase, SupportTicket } from '@/lib/domain/governance'

interface Props { tickets:SupportTicket[]; cases:ModerationCase[]; currentUserId:string; role:InternalRole }
type Pending =
  | {kind:'ticket';id:string;title:string;status:string;assignedAdminId:string|null}
  | {kind:'case';id:string;title:string;status:string;assignedAdminId:string|null}
  | {kind:'note';id:string;title:string}

const moderationRoles=new Set<InternalRole>(['super_admin','platform_admin','competition_admin','moderator'])

export function BackofficeClient({tickets,cases,currentUserId,role}:Props){
  const router=useRouter()
  const[pending,setPending]=useState<Pending|null>(null)
  const[text,setText]=useState('')
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState<string|null>(null)
  const openTickets=tickets.filter(t=>!['RESOLVED','CLOSED'].includes(t.status))
  const openCases=cases.filter(c=>!['RESOLVED','DISMISSED'].includes(c.status))

  async function execute(){
    if(!pending)return
    const trimmed=text.trim()
    if(pending.kind!=='note'&&trimmed.length<5){setError('Indica um motivo com pelo menos 5 caracteres.');return}
    if(pending.kind==='note'&&trimmed.length<2){setError('Escreve a nota antes de guardar.');return}
    setLoading(true);setError(null)
    try{
      const payload = pending.kind==='ticket'
        ? {action:'ticket-update',ticketId:pending.id,status:pending.status,assignedAdminId:pending.assignedAdminId,reason:trimmed}
        : pending.kind==='case'
          ? {action:'moderation-update',caseId:pending.id,status:pending.status,assignedAdminId:pending.assignedAdminId,resolution:pending.status==='RESOLVED'?{summary:trimmed}:null,reason:trimmed}
          : {action:'ticket-note',ticketId:pending.id,body:trimmed,internal:true}
      const response=await fetch('/api/admin/governance',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||'admin_operation_failed')
      setPending(null);setText('');router.refresh()
    }catch(e){setError(e instanceof Error?e.message:'admin_operation_failed')}finally{setLoading(false)}
  }

  function begin(value:Pending){setPending(value);setText('');setError(null)}

  return <div className="space-y-7">
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary"/><p className="clan-kicker">Operações internas</p></div><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Backoffice operacional.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Tickets e casos reais, com mudança de estado auditada. Nenhuma ação deste ecrã escreve diretamente em tabelas económicas ou competitivas.</p></section>

    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={Tickets} label="Tickets em aberto" value={openTickets.length}/><Metric icon={ShieldAlert} label="Casos em aberto" value={openCases.length}/><Metric icon={AlertTriangle} label="Críticos" value={openTickets.filter(t=>t.priority==='CRITICAL').length+openCases.filter(c=>c.severity==='CRITICAL').length}/></section>

    <section className="grid gap-5 xl:grid-cols-2">
      <Panel title="Fila de suporte" icon={Headphones}>{tickets.length===0?<Empty text="Sem tickets."/>:<div className="space-y-3">{tickets.map(ticket=><article key={ticket.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{ticket.subject}</p><p className="mt-1 text-xs text-muted-foreground">{ticket.category} · {ticket.priority} · {ticket.status}</p></div><span className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${ticket.priority==='CRITICAL'?'bg-destructive/10 text-destructive':'bg-white/[.04] text-muted-foreground'}`}>{ticket.priority}</span></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">{ticket.description}</p><div className="mt-4 flex flex-wrap gap-2">{!['RESOLVED','CLOSED'].includes(ticket.status)&&<Button size="sm" onClick={()=>begin({kind:'ticket',id:ticket.id,title:ticket.subject,status:'IN_PROGRESS',assignedAdminId:currentUserId})}><UserCheck className="mr-1.5 h-3.5 w-3.5"/>Assumir</Button>}{ticket.status==='IN_PROGRESS'&&<Button size="sm" variant="outline" onClick={()=>begin({kind:'ticket',id:ticket.id,title:ticket.subject,status:'RESOLVED',assignedAdminId:ticket.assignedAdminId??currentUserId})}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5"/>Resolver</Button>}<Button size="sm" variant="outline" onClick={()=>begin({kind:'note',id:ticket.id,title:ticket.subject})}><FileText className="mr-1.5 h-3.5 w-3.5"/>Nota interna</Button></div></article>)}</div>}</Panel>

      <Panel title="Moderação & fraude" icon={ShieldAlert}>{cases.length===0?<Empty text="Sem casos de moderação."/>:<div className="space-y-3">{cases.map(item=><article key={item.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{item.caseType} · {item.status}</p></div><span className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${['HIGH','CRITICAL'].includes(item.severity)?'bg-destructive/10 text-destructive':'bg-white/[.04] text-muted-foreground'}`}>{item.severity}</span></div>{moderationRoles.has(role)&&<div className="mt-4 flex flex-wrap gap-2">{!['RESOLVED','DISMISSED'].includes(item.status)&&<Button size="sm" onClick={()=>begin({kind:'case',id:item.id,title:item.summary,status:'INVESTIGATING',assignedAdminId:currentUserId})}>Investigar</Button>}{['INVESTIGATING','ACTION_REQUIRED'].includes(item.status)&&<Button size="sm" variant="outline" onClick={()=>begin({kind:'case',id:item.id,title:item.summary,status:'RESOLVED',assignedAdminId:item.assignedAdminId??currentUserId})}>Resolver caso</Button>}</div>}</article>)}</div>}</Panel>
    </section>

    <ConfirmationDialog open={Boolean(pending)} onOpenChange={open=>{if(!open&&!loading)setPending(null)}} title={pending?.kind==='note'?'Adicionar nota interna':pending?.kind==='case'?'Atualizar caso de moderação':'Atualizar ticket'} description={pending?.title} confirmLabel={pending?.kind==='note'?'Guardar nota':'Confirmar operação'} tone={pending?.kind==='case'?'warning':'default'} isLoading={loading} onConfirm={execute}><label className="block text-xs font-bold text-muted-foreground">{pending?.kind==='note'?'Nota':'Motivo obrigatório'}</label><textarea value={text} onChange={e=>setText(e.target.value)} rows={5} className="mt-2 w-full resize-none rounded-xl border border-white/[.08] bg-[#111] px-3.5 py-3 text-sm outline-none focus:border-primary/55" placeholder={pending?.kind==='note'?'Contexto para a equipa interna…':'Explica a decisão administrativa…'}/>{error&&<p className="mt-2 text-xs text-destructive">{error}</p>}</ConfirmationDialog>
  </div>
}

function Metric({icon:Icon,label,value}:{icon:typeof Tickets;label:string;value:number}){return <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-4 w-4 text-primary"/><p className="mt-3 text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>}
function Panel({title,icon:Icon,children}:{title:string;icon:typeof Tickets;children:React.ReactNode}){return <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary"/><h2 className="text-xl font-black">{title}</h2></div><div className="mt-5">{children}</div></section>}
function Empty({text}:{text:string}){return <p className="py-12 text-center text-sm text-muted-foreground">{text}</p>}
