'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Layers3, Loader2, RefreshCw, SearchCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface UniverseOption { id:string;name:string;kind:string;state:string }
interface CatalogCycleProgress {current:number;total:number;page:number;completed:number;failed:number}
interface CatalogPageResult {page:number;status:'COMPLETED'|'FAILED';requested:number;imported:number;failed:number;error?:string}
interface CatalogCycleResult {operation:'CATALOG_PAGE_CYCLE';definedPages:number[];processedPages:number;completedPages:number;failedPages:number;requested:number;imported:number;failed:number;pageResults:CatalogPageResult[]}

const MAX_CATALOG_PAGES_PER_CYCLE=50
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))

class ProviderRequestError extends Error {
  constructor(message:string,readonly status:number){super(message)}
}

function parseCatalogPages(value:string){
  const tokens=value.trim().replace(/\s*-\s*/g,'-').split(/[\s,;]+/).filter(Boolean)
  if(tokens.length===0)return{pages:[] as number[],error:'Define pelo menos uma página.'}

  const pages:number[]=[]
  const seen=new Set<number>()
  for(const token of tokens){
    const match=token.match(/^(\d+)(?:-(\d+))?$/)
    if(!match)return{pages:[] as number[],error:`Formato inválido: ${token}. Usa, por exemplo, 1-10, 15, 20-24.`}
    const start=Number.parseInt(match[1],10),end=Number.parseInt(match[2]??match[1],10)
    if(start<1||end<start||end>10_000)return{pages:[] as number[],error:`Intervalo inválido: ${token}.`}
    for(let page=start;page<=end;page++){
      if(!seen.has(page)){seen.add(page);pages.push(page)}
      if(pages.length>MAX_CATALOG_PAGES_PER_CYCLE)return{pages:[] as number[],error:`Cada ciclo pode carregar no máximo ${MAX_CATALOG_PAGES_PER_CYCLE} páginas.`}
    }
  }
  return{pages,error:null}
}

const count=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:0

export function PesdbProviderClient({universes,principalUniverseId,canManage}:{universes:UniverseOption[];principalUniverseId:string|null;canManage:boolean}){
  const router=useRouter()
  const[catalogPages,setCatalogPages]=useState('1-3'),[detailIds,setDetailIds]=useState(''),[universeId,setUniverseId]=useState(principalUniverseId??universes[0]?.id??''),[limit,setLimit]=useState(500)
  const[loading,setLoading]=useState<string|null>(null),[error,setError]=useState<string|null>(null),[result,setResult]=useState<Record<string,unknown>|null>(null),[confirmMaterialize,setConfirmMaterialize]=useState(false)
  const[catalogProgress,setCatalogProgress]=useState<CatalogCycleProgress|null>(null)

  async function requestAction(action:string,payload:Record<string,unknown>={}){
    const response=await fetch('/api/admin/players',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...payload})})
    const data=await response.json() as {result?:Record<string,unknown>;error?:string}
    if(!response.ok)throw new ProviderRequestError(data.error||'player_provider_operation_failed',response.status)
    return data.result??{}
  }

  async function execute(action:string,payload:Record<string,unknown>={}){
    setLoading(action);setError(null);setResult(null)
    try{
      setResult(await requestAction(action,payload))
      router.refresh()
    }catch(e){setError(e instanceof Error?e.message:'player_provider_operation_failed')}
    finally{setLoading(null)}
  }

  async function syncCatalogCycle(){
    const selection=parseCatalogPages(catalogPages)
    if(selection.error){setError(selection.error);return}

    setLoading('syncCatalog');setError(null);setResult(null)
    const pageResults:CatalogPageResult[]=[]
    let requested=0,imported=0,failed=0

    for(let index=0;index<selection.pages.length;index++){
      const page=selection.pages[index]
      setCatalogProgress({current:index+1,total:selection.pages.length,page,completed:pageResults.filter(item=>item.status==='COMPLETED').length,failed:pageResults.filter(item=>item.status==='FAILED').length})
      try{
        const outcome=await requestAction('syncCatalog',{page,pages:1})
        const pageResult:CatalogPageResult={page,status:'COMPLETED',requested:count(outcome.requested),imported:count(outcome.imported),failed:count(outcome.failed)}
        pageResults.push(pageResult)
        requested+=pageResult.requested;imported+=pageResult.imported;failed+=pageResult.failed
      }catch(cause){
        const message=cause instanceof Error?cause.message:'player_provider_operation_failed'
        pageResults.push({page,status:'FAILED',requested:0,imported:0,failed:0,error:message})
        if(cause instanceof ProviderRequestError&&(cause.status===401||cause.status===403))break
      }
      if(index<selection.pages.length-1)await wait(900)
    }

    const completedPages=pageResults.filter(item=>item.status==='COMPLETED').length
    const failedPages=pageResults.filter(item=>item.status==='FAILED').length
    setCatalogProgress({current:pageResults.length,total:selection.pages.length,page:pageResults.at(-1)?.page??selection.pages[0],completed:completedPages,failed:failedPages})
    setResult({operation:'CATALOG_PAGE_CYCLE',definedPages:selection.pages,processedPages:pageResults.length,completedPages,failedPages,requested,imported,failed,pageResults})
    if(pageResults.length<selection.pages.length)setError('O ciclo foi interrompido porque a sessão expirou ou deixou de ter permissão. Volta a autenticar-te e retoma as páginas em falta.')
    else if(failedPages>0)setError(`${failedPages} página${failedPages===1?' falhou':'s falharam'}. As restantes páginas foram processadas.`)
    setLoading(null)
    router.refresh()
  }

  const parsedCatalogPages=parseCatalogPages(catalogPages)
  const catalogCycleResult=result?.operation==='CATALOG_PAGE_CYCLE'?result as unknown as CatalogCycleResult:null

  return <div className="space-y-5">
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/><p className="text-[10px] font-black uppercase tracking-[.14em] text-primary">Arranque recomendado</p></div><h2 className="mt-2 text-xl font-black">Preparar starter pool equilibrado</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Procura automaticamente uma zona do catálogo com jogadores entre OVR 55–70. Jogadores de elite nunca são atribuídos gratuitamente pelo bootstrap.</p></div><Button disabled={!canManage||loading!==null} onClick={()=>execute('syncStarterPool')}>{loading==='syncStarterPool'?'A preparar…':'Preparar starter pool'}</Button></div>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
        <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary"/><h2 className="font-black">Sincronizar catálogo</h2></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Importação manual para ampliar o catálogo. A página 1 contém jogadores de topo; estes podem existir no mercado, mas não entram no starter squad.</p>
        <Field label="Páginas do ciclo"><input className={`${inputClass} mt-1`} value={catalogPages} onChange={event=>setCatalogPages(event.target.value)} placeholder="1-10, 15, 20-24"/></Field>
        <p className={`mt-2 text-[10px] leading-4 ${parsedCatalogPages.error?'text-destructive':'text-muted-foreground'}`}>{parsedCatalogPages.error??`${parsedCatalogPages.pages.length} página${parsedCatalogPages.pages.length===1?'':'s'} definida${parsedCatalogPages.pages.length===1?'':'s'} · máximo ${MAX_CATALOG_PAGES_PER_CYCLE} por ciclo.`}</p>
        {loading==='syncCatalog'&&catalogProgress?<div aria-live="polite" className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.025] p-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="inline-flex items-center gap-2 font-bold"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary"/>Página {catalogProgress.page}</span><span className="text-muted-foreground">{catalogProgress.current}/{catalogProgress.total}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-primary transition-[width]" style={{width:`${Math.round((catalogProgress.current/catalogProgress.total)*100)}%`}}/></div><p className="mt-2 text-[10px] text-muted-foreground">Mantém esta página aberta · {catalogProgress.completed} concluídas · {catalogProgress.failed} falhas</p></div>:null}
        <Button className="mt-4" variant="outline" disabled={!canManage||loading!==null||Boolean(parsedCatalogPages.error)} onClick={()=>void syncCatalogCycle()}>{loading==='syncCatalog'?<><Loader2 className="h-4 w-4 animate-spin"/>A sincronizar ciclo…</>:'Iniciar ciclo de páginas'}</Button>
      </article>

      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
        <div className="flex items-center gap-2"><SearchCheck className="h-4 w-4 text-primary"/><h2 className="font-black">Enriquecer jogadores</h2></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Lê fichas individuais para atributos, estilo, skills, pé, equipa e liga. Máximo de 6 IDs por operação.</p>
        <Field label="IDs PESDB"><input className={`${inputClass} mt-1`} placeholder="110718, 105683844338090" value={detailIds} onChange={e=>setDetailIds(e.target.value)}/></Field>
        <Button className="mt-4" variant="outline" disabled={!canManage||loading!==null||detailIds.trim().length===0} onClick={()=>execute('syncDetails',{externalIds:detailIds})}>{loading==='syncDetails'?'A enriquecer…':'Sincronizar detalhes'}</Button>
      </article>

      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
        <div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-primary"/><h2 className="font-black">Materializar no universo</h2></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Cria `UniversePlayer`, calcula valores económicos e tenta completar automaticamente plantéis abaixo do mínimo.</p>
        <Field label="Universo"><select className={`${inputClass} mt-1`} value={universeId} onChange={e=>setUniverseId(e.target.value)}>{universes.map(u=><option key={u.id} value={u.id}>{u.name} · {u.kind} · {u.state}</option>)}</select></Field>
        <Field label="Máximo de jogadores"><input className={`${inputClass} mt-1`} type="number" min={1} max={5000} value={limit} onChange={e=>setLimit(Math.max(1,Math.min(5000,Number(e.target.value)||500)))}/></Field>
        <Button className="mt-4" disabled={!canManage||loading!==null||!universeId} onClick={()=>setConfirmMaterialize(true)}>Materializar e completar plantéis</Button>
      </article>
    </section>

    {!canManage&&<div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">A tua role pode consultar o catálogo, mas só `super_admin` e `platform_admin` podem sincronizar ou materializar jogadores.</div>}
    {error&&<div className="rounded-xl border border-destructive/20 bg-destructive/[0.05] px-4 py-3 text-sm text-destructive">{error}</div>}
    {catalogCycleResult?<CatalogCycleSummary result={catalogCycleResult}/>:result&&<div className="rounded-xl border border-primary/15 bg-primary/[0.025] p-4"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-primary"/><p className="text-xs font-black uppercase tracking-[.12em]">Última operação</p></div><pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{JSON.stringify(result,null,2)}</pre></div>}

    <ConfirmationDialog open={confirmMaterialize} onOpenChange={open=>{if(!open&&loading===null)setConfirmMaterialize(false)}} title="Materializar jogadores neste universo?" description="Esta operação cria ou reavalia UniversePlayer e tenta preencher os plantéis abaixo do mínimo configurado. Ratings PESDB não são alterados." confirmLabel="Materializar jogadores" tone="warning" isLoading={loading==='materialize'} onConfirm={async()=>{await execute('materialize',{universeId,limit,rebootstrap:true});setConfirmMaterialize(false)}}>
      <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm"><p><span className="text-muted-foreground">Universo:</span> {universes.find(u=>u.id===universeId)?.name??universeId}</p><p className="mt-2"><span className="text-muted-foreground">Limite:</span> {limit.toLocaleString('pt-PT')} jogadores</p><p className="mt-2 text-xs text-muted-foreground">O bootstrap só pode atribuir assets disponíveis dentro da faixa OVR 55–70 definida na configuração `players.starter`.</p></div>
    </ConfirmationDialog>
  </div>
}

function CatalogCycleSummary({result}:{result:CatalogCycleResult}){
  return <section className="rounded-2xl border border-primary/15 bg-primary/[0.025] p-5">
    <div className="flex items-center gap-2"><Database className="h-4 w-4 text-primary"/><h2 className="text-xs font-black uppercase tracking-[.12em]">Resultado do ciclo</h2></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <CycleMetric label="Páginas concluídas" value={`${result.completedPages}/${result.definedPages.length}`}/>
      <CycleMetric label="Jogadores importados" value={`${result.imported}/${result.requested}`}/>
      <CycleMetric label="Falhas de jogadores" value={String(result.failed)}/>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">{result.pageResults.map(item=><span key={item.page} title={item.error} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${item.status==='COMPLETED'?'border-primary/15 bg-primary/[0.04] text-primary':'border-destructive/20 bg-destructive/[0.05] text-destructive'}`}>Pág. {item.page} · {item.status==='COMPLETED'?`${item.imported}/${item.requested}`:'falhou'}</span>)}</div>
    {result.processedPages<result.definedPages.length?<p className="mt-4 text-xs text-muted-foreground">Ficaram {result.definedPages.length-result.processedPages} páginas por processar. Mantém a lista e remove as páginas já concluídas antes de retomar.</p>:null}
  </section>
}

function CycleMetric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-black tabular-nums">{value}</p></div>}

function Field({label,children}:{label:string;children:ReactNode}){return <label className="mt-4 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label}{children}</label>}
const inputClass='h-10 w-full rounded-lg border border-white/[0.09] bg-black/30 px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/35'
