import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, AppWindow, Banknote, CircleDollarSign, Flag, Globe2, Landmark, ListChecks, LockKeyhole, ReceiptText, Settings, ShieldAlert, Swords, Tickets, Trophy, Users, WalletCards } from 'lucide-react'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { getAdminSession } from '@/lib/server/admin-auth'
import { Button } from '@/components/ui/button'
import { PlatformLink } from '@/components/admin/platform-link'

export const dynamic = 'force-dynamic'

export default async function AdminPanelPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin-access')
  const { userClient, serviceClient, role } = session

  const services = createAdminApplicationServices(userClient, serviceClient)
  const overview = await services.adminReads.overview.load()
  const m = overview.metrics

  return <div className="space-y-8">
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary"/><p className="clan-kicker">Platform Control Center</p></div><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Gestão global do Clã das Sombras.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Operação, governance, economia, competição, suporte e auditoria numa única superfície. Os indicadores abaixo vêm do domínio real; nenhuma métrica é fabricada no frontend.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:max-w-xs xl:justify-end"><div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Role ativa</p><p className="mt-1 text-sm font-black uppercase text-primary">{role.replaceAll('_',' ')}</p></div><Button asChild><PlatformLink><AppWindow className="mr-2 h-4 w-4"/>Abrir plataforma</PlatformLink></Button><Button asChild variant="outline"><Link href="/admin/backoffice"><Tickets className="mr-2 h-4 w-4"/>Abrir backoffice</Link></Button></div>
      </div>
    </section>

    <section className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label="Utilizadores" value={m.users} detail={`${m.clubs.toLocaleString('pt-PT')} clubes`} />
      <Metric icon={Globe2} label="Universos" value={m.universes} detail={`${m.activeUniverses} operacionais`} />
      <Metric icon={Trophy} label="Competições" value={m.competitions} detail={`${m.unsettledMatches} partidas por concluir`} />
      <Metric icon={WalletCards} label="Mercado" value={m.activeListings} detail="listings ativos" />
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatusCard icon={Tickets} label="Tickets abertos" value={m.openTickets} sub={`${m.criticalTickets} críticos`} danger={m.criticalTickets>0} href="/admin/backoffice" />
      <StatusCard icon={ShieldAlert} label="Casos de moderação" value={m.openModerationCases} sub={`${m.activeFreezes} freezes económicos ativos`} danger={m.openModerationCases>0||m.activeFreezes>0} href="#moderation" />
      <StatusCard icon={Banknote} label="Pagamentos pendentes" value={m.pendingPayments} sub={`${m.refundQueue} em reconciliação/refund`} danger={m.refundQueue>0} href="#payments" />
      <StatusCard icon={Flag} label="Feature flags" value={`${m.enabledFeatureFlags}/${m.totalFeatureFlags}`} sub="ativas / configuradas" href="#configuration" />
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Module icon={Users} title="Utilizadores & Clubes" detail="Identidade global, clubes por universo, reputação e contexto de suporte." href="/admin/users" />
      <Module icon={Globe2} title="Universos" detail="Estado, admission policy, perfis económicos e governance." href="/admin/universes" />
      <Module icon={Swords} title="Competição" detail="Partidas pendentes, seasons, ligas, taças e settlements." href="/admin/competition" />
      <Module icon={Landmark} title="Economia" detail="Ledger, mercado, dívida, freezes, Gold/Silver/Bronze e liabilities." href="/admin/economy" />
      <Module icon={CircleDollarSign} title="Stripe & Refunds" detail="Ordens de pagamento, refunds e reconciliação Gold." href="/admin/payments" />
      <Module icon={ShieldAlert} title="Moderação" detail="Casos, reports, disputes, fraude e freezes económicos." href="#moderation" />
      <Module icon={Settings} title="Configuração" detail="Platform config versionada e feature flags por scope." href="/admin/config" />
      <Module icon={ReceiptText} title="Audit Log" detail="Histórico administrativo imutável de ações sensíveis." href="/admin/audit" />
    </section>

    <section id="users" className="grid scroll-mt-24 gap-5 xl:grid-cols-[1fr_.9fr]">
      <Panel title="Utilizadores recentes" kicker="Identity" icon={Users}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.recentUsers.length===0?<Empty text="Ainda não existem utilizadores."/>:overview.recentUsers.map(item=><Row key={item.id} title={item.username} meta={`Manager Lv.${item.managerLevel} · reputação ${item.reputation}`} value={new Date(item.createdAt).toLocaleDateString('pt-PT')} />)}</div>
      </Panel>
      <Panel id="universes" title="Universos" kicker="Governance" icon={Globe2}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.universes.length===0?<Empty text="Ainda não existem universos."/>:overview.universes.map(u=><Row key={u.id} title={u.name} meta={`${u.kind} · ${u.accessPolicy} · ${u.economicProfile}`} value={u.state} />)}</div>
      </Panel>
    </section>

    <section id="competition" className="grid scroll-mt-24 gap-5 lg:grid-cols-3">
      <Summary icon={Trophy} title="Motor competitivo" value={m.competitions.toLocaleString('pt-PT')} detail="competições registadas" />
      <Summary icon={ListChecks} title="Partidas pendentes" value={m.unsettledMatches.toLocaleString('pt-PT')} detail="não SETTLED/CANCELLED" tone={m.unsettledMatches>0?'warning':'default'} />
      <Summary icon={Activity} title="Universos ativos" value={m.activeUniverses.toLocaleString('pt-PT')} detail="ativos, em época ou abertos" />
    </section>

    <section id="payments" className="grid scroll-mt-24 gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="Pagamentos recentes" kicker="Stripe / Gold" icon={Banknote}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.payments.length===0?<Empty text="Ainda não existem ordens de pagamento."/>:overview.payments.map(p=><Row key={p.id} title={`${(p.amountCents/100).toLocaleString('pt-PT',{style:'currency',currency:p.currency.toUpperCase()})} · ${p.goldAmount.toLocaleString('pt-PT')} Gold`} meta={`${p.status}${p.refundedCents>0?` · refund ${(p.refundedCents/100).toLocaleString('pt-PT')} ${p.currency.toUpperCase()}`:''}`} value={new Date(p.createdAt).toLocaleDateString('pt-PT')} />)}</div>
      </Panel>
      <Panel id="economy" title="Economia operacional" kicker="Risk & Money" icon={Landmark}>
        <div className="grid gap-3 sm:grid-cols-2"><Mini label="Listings ativos" value={m.activeListings}/><Mini label="Freezes ativos" value={m.activeFreezes}/><Mini label="Refund queue" value={m.refundQueue}/><Mini label="Pagamentos pendentes" value={m.pendingPayments}/></div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Grants, refunds, reversals e freezes continuam a ser operações auditadas. O Admin nunca deve editar saldos diretamente.</p>
      </Panel>
    </section>

    <section id="moderation" className="grid scroll-mt-24 gap-5 xl:grid-cols-2">
      <Panel title="Tickets recentes" kicker="Backoffice" icon={Tickets} action={<Button asChild size="sm" variant="outline"><Link href="/admin/backoffice">Ver fila</Link></Button>}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.tickets.length===0?<Empty text="Sem tickets na fila."/>:overview.tickets.map(t=><Row key={t.id} title={t.subject} meta={`${t.category} · ${t.priority}`} value={t.status} danger={t.priority==='CRITICAL'} />)}</div>
      </Panel>
      <Panel title="Casos de moderação" kicker="Trust & Safety" icon={ShieldAlert}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.moderationCases.length===0?<Empty text="Sem casos de moderação."/>:overview.moderationCases.map(c=><Row key={c.id} title={c.summary} meta={`${c.caseType} · ${c.severity}`} value={c.status} danger={c.severity==='CRITICAL'||c.severity==='HIGH'} />)}</div>
      </Panel>
    </section>

    <section id="configuration" className="grid scroll-mt-24 gap-5 xl:grid-cols-2">
      <Panel title="Feature flags" kicker="Runtime control" icon={Flag}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.featureFlags.length===0?<Empty text="Sem feature flags configuradas."/>:overview.featureFlags.map(f=><Row key={f.key} title={f.key} meta={`${f.scope}${f.scopeReference?` · ${f.scopeReference}`:''}`} value={f.enabled?'ON':'OFF'} accent={f.enabled} />)}</div>
      </Panel>
      <Panel title="Configuração versionada" kicker="Platform config" icon={Settings}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.configs.length===0?<Empty text="Sem configuração versionada."/>:overview.configs.map(c=><Row key={c.key} title={c.key} meta={c.category} value={`v${c.version}`} />)}</div>
      </Panel>
    </section>

    <section id="audit" className="scroll-mt-24">
      <Panel title="Audit Log" kicker="Governance" icon={ReceiptText}>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">{overview.auditLog.length===0?<Empty text="Ainda não existem ações administrativas auditadas."/>:overview.auditLog.map(item=><div key={item.id} className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-bold">{item.action}</p><p className="mt-1 text-xs text-muted-foreground">{item.targetType}{item.targetId?` · ${item.targetId}`:''}{item.reason?` · ${item.reason}`:''}</p></div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{new Date(item.createdAt).toLocaleString('pt-PT')}</p></div>)}</div>
      </Panel>
    </section>

    <section className="rounded-2xl border border-primary/15 bg-primary/[0.025] p-5 sm:p-6"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 text-primary"/><div><p className="font-black">Regra de segurança do Admin</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Nenhum botão administrativo deve fazer edição direta de tabelas económicas ou competitivas. Operações sensíveis passam por comandos server-side, reason obrigatório, idempotência quando aplicável e `admin_audit_log`.</p></div></div></section>
  </div>
}

function Metric({icon:Icon,label,value,detail}:{icon:typeof Users;label:string;value:number;detail:string}){return <article className="bg-[#0b0b0b] p-5"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><Icon className="h-4 w-4 text-primary"/>{label}</div><p className="mt-3 text-2xl font-black tabular-nums">{value.toLocaleString('pt-PT')}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article>}
function StatusCard({icon:Icon,label,value,sub,danger=false,href}:{icon:typeof Users;label:string;value:number|string;sub:string;danger?:boolean;href:string}){return <Link href={href} className={`rounded-2xl border bg-[#0b0b0b] p-5 transition hover:-translate-y-0.5 ${danger?'border-destructive/18 hover:border-destructive/30':'border-white/[0.07] hover:border-primary/20'}`}><Icon className={`h-5 w-5 ${danger?'text-destructive':'text-primary'}`}/><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-black tabular-nums ${danger?'text-destructive':''}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p></Link>}
function Module({icon:Icon,title,detail,href}:{icon:typeof Users;title:string;detail:string;href:string}){return <Link href={href} className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 transition hover:border-primary/20"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02]"><Icon className="h-4.5 w-4.5 text-primary"/></div><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></Link>}
function Panel({id,title,kicker,icon:Icon,children,action}:{id?:string;title:string;kicker:string;icon:typeof Users;children:React.ReactNode;action?:React.ReactNode}){return <article id={id} className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{kicker}</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><div className="flex items-center gap-3">{action}<Icon className="h-5 w-5 text-primary"/></div></div><div className="mt-5">{children}</div></article>}
function Row({title,meta,value,danger=false,accent=false}:{title:string;meta:string;value:string;danger?:boolean;accent?:boolean}){return <div className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p></div><span className={`text-[10px] font-black uppercase tracking-[0.12em] ${danger?'text-destructive':accent?'text-primary':'text-muted-foreground'}`}>{value}</span></div>}
function Summary({icon:Icon,title,value,detail,tone='default'}:{icon:typeof Users;title:string;value:string;detail:string;tone?:'default'|'warning'}){return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className={`h-5 w-5 ${tone==='warning'?'text-[var(--warning)]':'text-primary'}`}/><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article>}
function Mini({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-xl font-black tabular-nums">{value.toLocaleString('pt-PT')}</p></div>}
function Empty({text}:{text:string}){return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>}
