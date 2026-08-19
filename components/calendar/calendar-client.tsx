import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock3, Flag, Shield, Swords, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarMatchReadModel, CalendarReadModel, CalendarSeasonEventReadModel } from '@/lib/application/read-models'

export function CalendarClient({calendar}:{calendar:CalendarReadModel}){
  const active=calendar.matches.filter(entry=>!['SETTLED','CANCELLED'].includes(entry.match.state))
  const completed=[...calendar.matches.filter(entry=>['SETTLED','CANCELLED'].includes(entry.match.state))].sort((a,b)=>new Date(b.match.settledAt??b.match.updatedAt).getTime()-new Date(a.match.settledAt??a.match.updatedAt).getTime())
  const competitionCount=new Set(calendar.matches.map(entry=>entry.match.competitionId).filter(Boolean)).size
  const next=active.find(entry=>entry.match.scheduledAt)??active[0]??null

  return <div className="space-y-7">
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="clan-kicker">Calendário · {calendar.universe.name}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Agenda competitiva real do {calendar.club.name}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Fixtures geradas pelo motor competitivo, rounds e marcos da época aparecem aqui diretamente do domínio. Não existem jogos ou datas fictícias no frontend.</p></div>{next&&<Button asChild><Link href={`/play/${next.match.id}/pre-match`}><Swords className="mr-2 h-4 w-4"/>Abrir próxima partida</Link></Button>}</div>
    </section>

    <section className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={CalendarDays} label="Compromissos pendentes" value={active.length.toString()} detail={next?formatDateTime(next.match.scheduledAt):'Sem próxima partida'} />
      <Metric icon={CheckCircle2} label="Partidas liquidadas" value={completed.filter(entry=>entry.match.state==='SETTLED').length.toString()} detail="Settlement concluído" />
      <Metric icon={Trophy} label="Competições no calendário" value={competitionCount.toString()} detail="Liga, Taça ou torneio" />
      <Metric icon={Flag} label="Marcos de época" value={calendar.seasonEvents.length.toString()} detail="Inscrições e temporada" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Próximos compromissos</p><h2 className="mt-1 text-xl font-black">Fixtures do clube</h2></div><span className="text-xs text-muted-foreground">{active.length} pendente(s)</span></div>
        <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">{active.length===0?<Empty text="Ainda não existem fixtures pendentes. Se o clube está inscrito, o calendário aparece assim que a competição for ativada."/>:active.map(entry=><MatchRow key={entry.match.id} entry={entry} clubId={calendar.club.id} universeId={calendar.universe.id}/>)}</div>
      </article>

      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Época</p><h2 className="mt-1 text-xl font-black">Marcos oficiais</h2></div>
        <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">{calendar.seasonEvents.length===0?<Empty text="A época ainda não tem datas adicionais configuradas."/>:calendar.seasonEvents.map(event=><SeasonEvent key={event.id} event={event}/>)}</div>
      </article>
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Histórico</p><h2 className="mt-1 text-xl font-black">Resultados e cancelamentos</h2></div><Button asChild variant="outline" size="sm"><Link href={`/play?universe=${calendar.universe.id}`}>Abrir lifecycle</Link></Button></div>
      <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">{completed.length===0?<Empty text="Ainda não existem partidas concluídas."/>:completed.slice(0,30).map(entry=><MatchRow key={entry.match.id} entry={entry} clubId={calendar.club.id} universeId={calendar.universe.id}/>)}</div>
    </section>
  </div>
}

function MatchRow({entry,clubId,universeId}:{entry:CalendarMatchReadModel;clubId:string;universeId:string}){
  const ownHome=entry.match.homeClubId===clubId
  const opponent=ownHome?entry.awayClubName:entry.homeClubName
  const final=['SETTLED','CANCELLED'].includes(entry.match.state)
  const hasScore=entry.match.homeScore!==null&&entry.match.awayScore!==null
  const href=final?`/play?universe=${universeId}`:`/play/${entry.match.id}/pre-match`
  return <div className="grid gap-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02]"><Shield className="h-4 w-4 text-primary"/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={href} className="truncate text-sm font-black hover:text-primary">vs {opponent}</Link><span className="rounded-md border border-white/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{entry.match.state}</span></div><p className="mt-1 text-xs text-muted-foreground">{entry.competitionName??'Partida'}{entry.roundName?` · ${entry.roundName}`:entry.roundNumber?` · Round ${entry.roundNumber}`:''} · {ownHome?'Casa':'Fora'}</p><p className="mt-1 text-[10px] text-muted-foreground/75">{formatDateTime(entry.match.scheduledAt)}</p></div><div className="sm:text-right">{hasScore&&<p className="text-lg font-black">{entry.match.homeScore} — {entry.match.awayScore}</p>}<Link href={href} className="text-xs font-bold text-primary hover:underline">{final?'Ver histórico':'Abrir pré-jogo'}</Link></div></div>
}

function SeasonEvent({event}:{event:CalendarSeasonEventReadModel}){const labels:Record<CalendarSeasonEventReadModel['kind'],string>={REGISTRATION_START:'Inscrições',REGISTRATION_END:'Inscrições',SEASON_START:'Temporada',SEASON_END:'Temporada'};return <div className="flex gap-3 py-4"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><div><p className="text-sm font-bold">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{labels[event.kind]} · {formatDateTime(event.at)}</p></div></div>}
function Metric({icon:Icon,label,value,detail}:{icon:typeof CalendarDays;label:string;value:string;detail:string}){return <article className="bg-[#0b0b0b] p-5"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.15em] text-muted-foreground"><Icon className="h-4 w-4 text-primary"/>{label}</div><p className="mt-3 text-2xl font-black tabular-nums">{value}</p><p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p></article>}
function Empty({text}:{text:string}){return <p className="py-10 text-center text-sm leading-6 text-muted-foreground">{text}</p>}
function formatDateTime(value:string|null){if(!value)return'Data por definir';return new Date(value).toLocaleString('pt-PT',{dateStyle:'medium',timeStyle:'short'})}
