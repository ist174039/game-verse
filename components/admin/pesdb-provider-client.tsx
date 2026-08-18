'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Layers3, RefreshCw, SearchCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface UniverseOption { id:string;name:string;kind:string;state:string }

export function PesdbProviderClient({universes,principalUniverseId,canManage}:{universes:UniverseOption[];principalUniverseId:string|null;canManage:boolean}){
  const router=useRouter()
  const[page,setPage]=useState(1),[pages,setPages]=useState(1),[detailIds,setDetailIds]=useState(''),[universeId,setUniverseId]=useState(principalUniverseId??universes[0]?.id??''),[limit,setLimit]=useState(500)
  const[loading,setLoading]=useState<string|null>(null),[error,setError]=useState<string|null>(null),[result,setResult]=useState<Record<string,unknown>|null>(null),[confirmMaterialize,setConfirmMaterialize]=useState(false)

  async function execute(action:string,payload:Record<string,unknown>={}){
    setLoading(action);setError(null);setResult(null)
    try{
      const response=await fetch('/api/admin/players',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...payload})})
      const data=await response.json() as {result?:Record<string,unknown>;error?:string}
      if(!response.ok)throw new Error(data.error||'player_provider_operation_failed')
      setResult(data.result??{})
      router.refresh()
    }catch(e){setError(e instanceof Error?e.message:'player_provider_operation_failed')}
    finally{setLoading(null)}
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/><p className="text-[10px] font-black uppercase tracking-[.14em] text-primary">Arranque recomendado</p></div><h2 className="mt-2 text-xl font-black">Preparar starter pool equilibrado</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Procura automaticamente uma zona do catálogo com jogadores entre OVR 55–70. Jogadores de elite nunca são atribuídos gratuitamente pelo bootstrap.</p></div><Button disabled={!canManage||loading!==null} onClick={()=>execute('syncStarterPool')}>{loading==='syncStarterPool'?'A preparar…':'Preparar starter pool'}</Button></div>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
        <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary"/><h2 className="font-black">Sincronizar catálogo</h2></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Importação manual para ampliar o catálogo. A página 1 contém jogadores de topo; estes podem existir no mercado, mas não entram no starter squad.</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><Field label="Página"><input className={inputClass} type="number" min={1} value={page} onChange={e=>setPage(Math.max(1,Number(e.target.value)||1))}/></Field><Field label="N.º páginas"><input className={inputClass} type="number" min={1} max={3} value={pages} onChange={e=>setPages(Math.max(1,Math.min(3,Number(e.target.value)||1)))}/></Field></div>
        <Button className="mt-4" variant="outline" disabled={!canManage||loading!==null} onClick={()=>execute('syncCatalog',{page,pages})}>{loading==='syncCatalog'?'A sincronizar…':'Sincronizar páginas'}</Button>
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
    {result&&<div className="rounded-xl border border-primary/15 bg-primary/[0.025] p-4"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-primary"/><p className="text-xs font-black uppercase tracking-[.12em]">Última operação</p></div><pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{JSON.stringify(result,null,2)}</pre></div>}

    <ConfirmationDialog open={confirmMaterialize} onOpenChange={open=>{if(!open&&loading===null)setConfirmMaterialize(false)}} title="Materializar jogadores neste universo?" description="Esta operação cria ou reavalia UniversePlayer e tenta preencher os plantéis abaixo do mínimo configurado. Ratings PESDB não são alterados." confirmLabel="Materializar jogadores" tone="warning" isLoading={loading==='materialize'} onConfirm={async()=>{await execute('materialize',{universeId,limit,rebootstrap:true});setConfirmMaterialize(false)}}>
      <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm"><p><span className="text-muted-foreground">Universo:</span> {universes.find(u=>u.id===universeId)?.name??universeId}</p><p className="mt-2"><span className="text-muted-foreground">Limite:</span> {limit.toLocaleString('pt-PT')} jogadores</p><p className="mt-2 text-xs text-muted-foreground">O bootstrap só pode atribuir assets disponíveis dentro da faixa OVR 55–70 definida na configuração `players.starter`.</p></div>
    </ConfirmationDialog>
  </div>
}

function Field({label,children}:{label:string;children:ReactNode}){return <label className="mt-4 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label}{children}</label>}
const inputClass='h-10 w-full rounded-lg border border-white/[0.09] bg-black/30 px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/35'
