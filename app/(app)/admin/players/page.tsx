import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Database, Layers3, RefreshCw, Search, UsersRound } from 'lucide-react'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'
import { PESDB_PROVIDER } from '@/lib/infrastructure/providers/pesdb'
import { PesdbProviderClient } from '@/components/admin/pesdb-provider-client'
import { Button } from '@/components/ui/button'

export const dynamic='force-dynamic'
const POSITIONS=['GK','CB','LB','RB','DMF','CMF','AMF','LMF','RMF','LWF','RWF','SS','CF']
const numberParam=(value:string|undefined,fallback:number,min:number,max:number)=>{const parsed=Number.parseInt(value??'',10);return Number.isFinite(parsed)?Math.max(min,Math.min(max,parsed)):fallback}

export default async function AdminPlayersPage({searchParams}:{searchParams:Promise<{q?:string;page?:string;size?:string;position?:string;minOvr?:string;maxOvr?:string}>}){
  const session=await getAdminSession();if(!session)redirect('/dashboard')
  const params=await searchParams
  const q=(params.q??'').replace(/[^\p{L}\p{N}\s.'-]/gu,' ').replace(/\s+/g,' ').trim().slice(0,80)
  const page=numberParam(params.page,1,1,100000),size=numberParam(params.size,25,10,100)
  const position=POSITIONS.includes(params.position??'')?params.position??'':''
  const minOvr=numberParam(params.minOvr,1,1,100),maxOvr=numberParam(params.maxOvr,100,1,100)
  const from=(page-1)*size,to=from+size-1

  const[playerCountQ,snapshotCountQ,universesQ,runsQ,starterConfigQ]=await Promise.all([
    session.serviceClient.from('player_master').select('id',{count:'exact',head:true}).eq('provider',PESDB_PROVIDER),
    session.serviceClient.from('player_provider_snapshot').select('id',{count:'exact',head:true}).eq('provider',PESDB_PROVIDER),
    session.serviceClient.from('universe').select('id,name,slug,kind,state').not('state','in','(CANCELLED,ARCHIVED)').order('kind').order('created_at'),
    session.serviceClient.from('player_provider_sync_run').select('*').eq('provider',PESDB_PROVIDER).order('completed_at',{ascending:false}).limit(12),
    session.serviceClient.from('platform_config').select('value').eq('key','players.starter').maybeSingle(),
  ])
  for(const result of[playerCountQ,snapshotCountQ,universesQ,runsQ,starterConfigQ])if(result.error)throw result.error

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

  let catalogQuery=session.serviceClient.from('player_master').select('id,external_id,provider_version,name,position,overall,nationality,attributes,updated_at',{count:'exact'}).eq('provider',PESDB_PROVIDER)
  if(q)catalogQuery=catalogQuery.or(`name.ilike.%${q}%,external_id.ilike.%${q}%,nationality.ilike.%${q}%`)
  if(position)catalogQuery=catalogQuery.eq('position',position)
  catalogQuery=catalogQuery.gte('overall',Math.min(minOvr,maxOvr)).lte('overall',Math.max(minOvr,maxOvr)).order('name',{ascending:true}).range(from,to)
  const catalogQ=await catalogQuery
  if(catalogQ.error)throw catalogQ.error
  const total=catalogQ.count??0,totalPages=Math.max(1,Math.ceil(total/size))
  const canManage=canAdmin(session.role,'PLAYERS')
  const href=(nextPage:number)=>{const next=new URLSearchParams();if(q)next.set('q',q);if(position)next.set('position',position);if(minOvr!==1)next.set('minOvr',String(minOvr));if(maxOvr!==100)next.set('maxOvr',String(maxOvr));if(size!==25)next.set('size',String(size));if(nextPage>1)next.set('page',String(nextPage));const s=next.toString();return s?`/admin/players?${s}`:'/admin/players'}

  return <div className="space-y-7">
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5"/>Admin</Link>
      <div className="mt-4 flex items-center gap-2"><Database className="h-5 w-5 text-primary"/><h1 className="text-2xl font-black">Jogadores · PESDB/eFootball</h1></div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Catálogo canónico sincronizado, pesquisável e paginado. PESDB fornece factos do jogador; preços, contratos e ownership continuam a pertencer ao domínio do Clã.</p>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={Database} label="PlayerMaster PESDB" value={playerCountQ.count??0} detail="registos canónicos"/>
      <Metric icon={RefreshCw} label="Snapshots" value={snapshotCountQ.count??0} detail="alterações do provider"/>
      <Metric icon={Layers3} label="No Universo Principal" value={universePlayers} detail="UniversePlayer materializados"/>
      <Metric icon={UsersRound} label="Disponíveis" value={availablePlayers} detail="sem clube"/>
      <Metric icon={UsersRound} label="Starter elegíveis" value={starterEligible} detail={`OVR ${starterMin}–${starterMax}`}/>
    </section>

    <PesdbProviderClient universes={universes.map(({id,name,kind,state})=>({id,name,kind,state}))} principalUniverseId={principal?.id??null} canManage={canManage}/>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h2 className="text-xl font-black">Jogadores sincronizados</h2><p className="mt-1 text-xs text-muted-foreground">{total.toLocaleString('pt-PT')} resultado{total===1?'':'s'} com os filtros atuais.</p></div>
      <form action="/admin/players" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_110px_92px_92px_90px_auto]">
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><input name="q" defaultValue={q} placeholder="Nome, PESDB ID ou país" className="h-10 w-full rounded-xl border border-white/[.08] bg-black/25 pl-9 pr-3 text-sm outline-none focus:border-primary/45"/></label>
        <select name="position" defaultValue={position} className="h-10 rounded-xl border border-white/[.08] bg-[#111] px-3 text-sm outline-none"><option value="">Posição</option>{POSITIONS.map(item=><option key={item} value={item}>{item}</option>)}</select>
        <input name="minOvr" type="number" min="1" max="100" defaultValue={minOvr===1?'':minOvr} placeholder="OVR min" className="h-10 rounded-xl border border-white/[.08] bg-black/25 px-3 text-sm outline-none"/>
        <input name="maxOvr" type="number" min="1" max="100" defaultValue={maxOvr===100?'':maxOvr} placeholder="OVR max" className="h-10 rounded-xl border border-white/[.08] bg-black/25 px-3 text-sm outline-none"/>
        <select name="size" defaultValue={String(size)} className="h-10 rounded-xl border border-white/[.08] bg-[#111] px-3 text-sm outline-none"><option value="25">25 / pág.</option><option value="50">50 / pág.</option><option value="100">100 / pág.</option></select>
        <Button type="submit" size="sm" className="h-10">Pesquisar</Button>
      </form></div>
      {(q||position||minOvr!==1||maxOvr!==100||size!==25)&&<div className="mt-3 flex justify-end"><Button asChild variant="ghost" size="sm"><Link href="/admin/players">Limpar filtros</Link></Button></div>}
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-white/[0.07] text-left text-[10px] uppercase tracking-[.13em] text-muted-foreground"><th className="pb-3">Jogador</th><th className="pb-3">Pos.</th><th className="pb-3">OVR</th><th className="pb-3">Nacionalidade</th><th className="pb-3">Equipa</th><th className="pb-3">Profundidade</th></tr></thead><tbody>{(catalogQ.data??[]).map((p:any)=><tr key={p.id} className="border-b border-white/[0.05]"><td className="py-3"><p className="font-black">{p.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">PESDB #{p.external_id}</p></td><td className="py-3 font-bold">{p.position}</td><td className="py-3 text-lg font-black text-primary">{p.overall}</td><td className="py-3">{p.nationality??'—'}</td><td className="py-3">{p.attributes?.teamName??'—'}</td><td className="py-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{p.attributes?.sourceDepth??'CATALOG'}</td></tr>)}{(catalogQ.data??[]).length===0&&<tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Nenhum jogador corresponde à pesquisa.</td></tr>}</tbody></table></div>
      <div className="mt-5 flex flex-col gap-3 border-t border-white/[.06] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Página <strong className="text-foreground">{page}</strong> de <strong className="text-foreground">{totalPages}</strong> · {size} por página</p><div className="flex gap-2">{page>1?<Button asChild size="sm" variant="outline"><Link href={href(page-1)}>Anterior</Link></Button>:<Button size="sm" variant="outline" disabled>Anterior</Button>}{page<totalPages?<Button asChild size="sm" variant="outline"><Link href={href(page+1)}>Seguinte</Link></Button>:<Button size="sm" variant="outline" disabled>Seguinte</Button>}</div></div>
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><h2 className="text-xl font-black">Histórico de sync</h2><p className="mt-1 text-xs text-muted-foreground">Cada operação administrativa fica registada e auditada.</p><div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">{(runsQ.data??[]).map((run:any)=><div key={run.id} className="py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{run.sync_type}{run.metadata?.starterPool?' · STARTER POOL':run.page_number?` · pág. ${run.page_number}`:''}</p><span className={`text-[10px] font-black uppercase tracking-[.12em] ${run.status==='COMPLETED'?'text-primary':run.status==='FAILED'?'text-destructive':'text-muted-foreground'}`}>{run.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{run.imported_count}/{run.requested_count} importados · {run.failed_count} falhas</p><p className="mt-1 text-[10px] text-muted-foreground">{run.provider_version??'PESDB'} · {new Date(run.completed_at).toLocaleString('pt-PT')}</p></div>)}{(runsQ.data??[]).length===0&&<p className="py-10 text-center text-sm text-muted-foreground">Ainda não foi executada nenhuma sincronização.</p>}</div></section>
  </div>
}

function Metric({icon:Icon,label,value,detail}:{icon:typeof Database;label:string;value:number;detail:string}){return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-4 w-4 text-primary"/><p className="mt-3 text-2xl font-black tabular-nums">{value.toLocaleString('pt-PT')}</p><p className="mt-1 text-xs font-bold">{label}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></article>}
