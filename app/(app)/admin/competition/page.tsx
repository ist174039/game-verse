import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Swords, Trophy } from 'lucide-react'
import { AdminCompetitionActions } from '@/components/admin/admin-competition-actions'
import { AdminDisputeResolution } from '@/components/admin/admin-dispute-resolution'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'

export const dynamic='force-dynamic'

type Row=Record<string,any>

export default async function AdminCompetitionPage(){
  const session=await getAdminSession()
  if(!session)redirect('/dashboard')

  const[competitionsQ,matchesQ,disputesQ,registrationsQ,universesQ,clubsQ]=await Promise.all([
    session.serviceClient.from('competition').select('*').order('created_at',{ascending:false}).limit(100),
    session.serviceClient.from('match').select('*').order('created_at',{ascending:false}).limit(500),
    session.serviceClient.from('match_dispute').select('*').order('created_at',{ascending:false}).limit(100),
    session.serviceClient.from('competition_registration').select('competition_id,state'),
    session.serviceClient.from('universe').select('id,name'),
    session.serviceClient.from('club').select('id,name,user_id'),
  ])
  for(const q of[competitionsQ,matchesQ,disputesQ,registrationsQ,universesQ,clubsQ])if(q.error)throw q.error

  const competitions=(competitionsQ.data??[]) as Row[]
  const matches=(matchesQ.data??[]) as Row[]
  const disputes=(disputesQ.data??[]) as Row[]
  const registrations=(registrationsQ.data??[]) as Row[]
  const universeNames=new Map((universesQ.data??[]).map((u:Row)=>[u.id,u.name]))
  const clubNames=new Map((clubsQ.data??[]).map((club:Row)=>[club.id,club.name]))
  const matchById=new Map(matches.map(match=>[match.id,match]))
  const canOperate=canAdmin(session.role,'COMPETITION')
  const openDisputes=disputes.filter(dispute=>!['RESOLVED','REJECTED'].includes(dispute.state))

  return <div className="space-y-7">
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5"/>Admin</Link>
      <div className="mt-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/><h1 className="text-2xl font-black">Competição</h1></div>
      <p className="mt-2 text-sm text-muted-foreground">Inscrições, geração do calendário, rounds, progressão e resolução auditável de disputas em todos os universos.</p>
    </section>

    <section className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Trophy} label="Competições" value={competitions.length}/>
      <Metric icon={Swords} label="Partidas pendentes" value={matches.filter(match=>!['SETTLED','CANCELLED'].includes(match.state)).length}/>
      <Metric icon={AlertTriangle} label="Disputas abertas" value={openDisputes.length}/>
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-black">Competições</h2><p className="mt-1 text-xs text-muted-foreground">Ativar transforma inscrições válidas em participantes e gera o calendário. Processar recalcula e avança o formato.</p></div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead><tr className="border-b border-white/[0.07] text-left text-[10px] uppercase tracking-[.13em] text-muted-foreground"><th className="pb-3">Competição</th><th className="pb-3">Universo</th><th className="pb-3">Estado</th><th className="pb-3">Inscrições</th><th className="pb-3">Partidas</th><th className="pb-3">Pendentes</th><th className="pb-3 text-right">Operação</th></tr></thead>
          <tbody>{competitions.map(competition=>{
            const competitionMatches=matches.filter(match=>match.competition_id===competition.id)
            const registrationsCount=registrations.filter(registration=>registration.competition_id===competition.id&&!['REJECTED','WITHDRAWN'].includes(registration.state)).length
            return <tr key={competition.id} className="border-b border-white/[0.05]">
              <td className="py-4"><Link href={`/tournaments/${competition.id}`} className="font-black hover:text-primary">{competition.name}</Link><p className="mt-1 text-xs text-muted-foreground">{competition.type} · pool {Number(competition.prize_pool).toLocaleString('pt-PT')} S</p></td>
              <td className="py-4">{universeNames.get(competition.universe_id)??competition.universe_id}</td>
              <td className="py-4 font-bold">{competition.status}</td>
              <td className="py-4">{registrationsCount}</td>
              <td className="py-4">{competitionMatches.length}</td>
              <td className="py-4">{competitionMatches.filter(match=>!['SETTLED','CANCELLED'].includes(match.state)).length}</td>
              <td className="py-4 text-right">{canOperate?<AdminCompetitionActions competitionId={competition.id} status={competition.status}/>:<span className="text-xs text-muted-foreground">read-only</span>}</td>
            </tr>
          })}</tbody>
        </table>
      </div>
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">Disputas de resultado</h2><p className="mt-1 text-xs text-muted-foreground">A decisão administrativa pode manter o marcador, corrigi-lo ou exigir repetição. Todas as decisões exigem motivo e ficam no audit log.</p></div><span className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground">{openDisputes.length} abertas</span></div>
      <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {disputes.map(dispute=>{
          const match=matchById.get(dispute.match_id)
          const unresolved=!['RESOLVED','REJECTED'].includes(dispute.state)
          const homeClub=match?clubNames.get(match.home_club_id)??match.home_club_id:'Clube casa'
          const awayClub=match?clubNames.get(match.away_club_id)??match.away_club_id:'Clube fora'
          return <article key={dispute.id} className="py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-black">{homeClub} <span className="text-white/30">vs</span> {awayClub}</p><span className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${unresolved?'border-destructive/25 bg-destructive/[.06] text-destructive':'border-white/[0.08] bg-white/[0.02] text-muted-foreground'}`}>{dispute.state}</span></div>
                <p className="mt-2 text-sm text-muted-foreground">{dispute.reason}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground"><span>Match {dispute.match_id}</span><span>Aberta em {new Date(dispute.created_at).toLocaleString('pt-PT')}</span>{match&&<span>Resultado {match.home_score??'—'} — {match.away_score??'—'}</span>}</div>
                {!unresolved&&dispute.resolution&&<p className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-muted-foreground"><strong className="text-foreground">{dispute.decision??'RESOLVIDA'}:</strong> {dispute.resolution}</p>}
              </div>
              {unresolved&&canOperate&&match?<div className="shrink-0"><AdminDisputeResolution disputeId={dispute.id} homeClub={String(homeClub)} awayClub={String(awayClub)} homeScore={typeof match.home_score==='number'?match.home_score:null} awayScore={typeof match.away_score==='number'?match.away_score:null}/></div>:unresolved?<span className="text-xs text-muted-foreground">read-only</span>:null}
            </div>
          </article>
        })}
        {disputes.length===0&&<p className="py-10 text-center text-sm text-muted-foreground">Sem disputas.</p>}
      </div>
    </section>
  </div>
}

function Metric({icon:Icon,label,value}:{icon:typeof Trophy;label:string;value:number}){
  return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-4 w-4 text-primary"/><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></article>
}
