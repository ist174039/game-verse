import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Database, Layers3, RefreshCw, UsersRound } from 'lucide-react'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'
import { PESDB_PROVIDER } from '@/lib/infrastructure/providers/pesdb'
import { PesdbProviderClient } from '@/components/admin/pesdb-provider-client'

export const dynamic='force-dynamic'

export default async function AdminPlayersPage(){
  const session=await getAdminSession();if(!session)redirect('/dashboard')
  const[playerCountQ,snapshotCountQ,universesQ,runsQ,recentQ,starterConfigQ]=await Promise.all([
    session.serviceClient.from('player_master').select('id',{count:'exact',head:true}).eq('provider',PESDB_PROVIDER),
    session.serviceClient.from('player_provider_snapshot').select('id',{count:'exact',head:true}).eq('provider',PESDB_PROVIDER),
    session.serviceClient.from('universe').select('id,name,slug,kind,state').not('state','in','(CANCELLED,ARCHIVED)').order('kind').order('created_at'),
    session.serviceClient.from('player_provider_sync_run').select('*').eq('provider',PESDB_PROVIDER).order('completed_at',{ascending:false}).limit(12),
    session.serviceClient.from('player_master').select('id,external_id,provider_version,name,position,overall,nationality,attributes,updated_at').eq('provider',PESDB_PROVIDER).order('updated_at',{ascending:false}).limit(40),
    session.serviceClient.from('platform_config').select('value').eq('key','players.starter').maybeSingle(),
  ])
  for(const q of[playerCountQ,snapshotCountQ,universesQ,runsQ,recentQ,starterConfigQ])if(q.error)throw q.error
  const universes=(universesQ.data??[]) as Array<{id:string;name:string;slug:string;kind:string;state:string}>
  const principal=universes.find(u=>u.slug==='principal')??universes.find(u=>u.kind==='MAIN')??null
  const starterCfg=(starterConfigQ.data?.value??{}) as Record<string,unknown>
  const starterMin=Number(starterCfg.min_overall??55),starterMax=Number(starterCfg.max_overall??70)
  let universePlayers=0,availablePlayers=0,starterEligible=0
  if(principal){
    const[allQ,availableQ,eligibleQ]=await Promise.all([
      session.serviceClient.from('universe_player').select('id',{count:'exact',head:true}).eq('universe_id',principal.id),
      session.serviceClient.from('universe_player').select('id',{count:'exact',head:true}).eq('universe_id',principal.id).eq('status','AVAILABLE').is('owner_club_id',null),
      session.serviceClient.from('universe_player').select('id,player_master!inner(overall)',{count:'exact',head:true}).eq('universe_id',principal.id).eq('status','AVAILABLE').is('owner_club_id',null).gte('player_master.overall',starterMin).lte('player_master.overall',starterMax),
    ])
    if(allQ.error)throw allQ.error;if(availableQ.error)throw availableQ.error;if(eligibleQ.error)throw eligibleQ.error
    universePlayers=allQ.count??0;availablePlayers=availableQ.count??0;starterEligible=eligibleQ.count??0
  }
  const canManage=canAdmin(session.role,'PLAYERS')
  return <div className="space-y-7">
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5"/>Admin</Link>
      <div className="mt-4 flex items-center gap-2"><Database className="h-5 w-5 text-primary"/><h1 className="text-2xl font-black">Jogadores · PESDB/eFootball</h1></div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">PESDB é o provider externo do `PlayerMaster`. O Clã guarda snapshots e valores económicos próprios; overall e atributos nunca evoluem por XP interno.</p>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={Database} label="PlayerMaster PESDB" value={playerCountQ.count??0} detail="registos canónicos"/>
      <Metric icon={RefreshCw} label="Snapshots" value={snapshotCountQ.count??0} detail="alterações do provider"/>
      <Metric icon={Layers3} label="No Universo Principal" value={universePlayers} detail="UniversePlayer materializados"/>
      <Metric icon={UsersRound} label="Disponíveis" value={availablePlayers} detail="sem clube"/>
      <Metric icon={UsersRound} label="Starter elegíveis" value={starterEligible} detail={`OVR ${starterMin}–${starterMax}`}/>
    </section>

    <PesdbProviderClient universes={universes.map(({id,name,kind,state})=>({id,name,kind,state}))} principalUniverseId={principal?.id??null} canManage={canManage}/>

    <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><h2 className="text-xl font-black">Jogadores sincronizados</h2><p className="mt-1 text-xs text-muted-foreground">Últimos registos atualizados no catálogo canónico.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-white/[0.07] text-left text-[10px] uppercase tracking-[.13em] text-muted-foreground"><th className="pb-3">Jogador</th><th className="pb-3">Pos.</th><th className="pb-3">OVR</th><th className="pb-3">Nacionalidade</th><th className="pb-3">Equipa</th><th className="pb-3">Profundidade</th></tr></thead><tbody>{(recentQ.data??[]).map((p:any)=><tr key={p.id} className="border-b border-white/[0.05]"><td className="py-3"><p className="font-black">{p.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">PESDB #{p.external_id}</p></td><td className="py-3 font-bold">{p.position}</td><td className="py-3 text-lg font-black text-primary">{p.overall}</td><td className="py-3">{p.nationality??'—'}</td><td className="py-3">{p.attributes?.teamName??'—'}</td><td className="py-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{p.attributes?.sourceDepth??'CATALOG'}</td></tr>)}</tbody></table></div></article>
      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><h2 className="text-xl font-black">Histórico de sync</h2><p className="mt-1 text-xs text-muted-foreground">Cada operação administrativa fica registada e auditada.</p><div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">{(runsQ.data??[]).map((run:any)=><div key={run.id} className="py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{run.sync_type}{run.metadata?.starterPool?' · STARTER POOL':run.page_number?` · pág. ${run.page_number}`:''}</p><span className={`text-[10px] font-black uppercase tracking-[.12em] ${run.status==='COMPLETED'?'text-primary':run.status==='FAILED'?'text-destructive':'text-muted-foreground'}`}>{run.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{run.imported_count}/{run.requested_count} importados · {run.failed_count} falhas</p><p className="mt-1 text-[10px] text-muted-foreground">{run.provider_version??'PESDB'} · {new Date(run.completed_at).toLocaleString('pt-PT')}</p></div>)}{(runsQ.data??[]).length===0&&<p className="py-10 text-center text-sm text-muted-foreground">Ainda não foi executada nenhuma sincronização.</p>}</div></article>
    </section>

    <section className="rounded-2xl border border-primary/15 bg-primary/[0.025] p-5 text-xs leading-5 text-muted-foreground"><p className="font-black text-foreground">Fluxo recomendado para arrancar agora</p><p className="mt-2">1. `Preparar starter pool` procura jogadores dentro da faixa OVR {starterMin}–{starterMax} → 2. `Materializar e completar plantéis` cria os `UniversePlayer` no Universo Principal e reexecuta o bootstrap → 3. o Dashboard deixa de apresentar o bloqueio de plantel → 4. detalhes individuais podem ser enriquecidos apenas para jogadores usados/negociados. As páginas de elite podem ser sincronizadas separadamente sem oferecer estrelas gratuitamente.</p></section>
  </div>
}

function Metric({icon:Icon,label,value,detail}:{icon:typeof Database;label:string;value:number;detail:string}){return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-4 w-4 text-primary"/><p className="mt-3 text-2xl font-black tabular-nums">{value.toLocaleString('pt-PT')}</p><p className="mt-1 text-xs font-bold">{label}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></article>}
