'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, PencilLine, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Input } from '@/components/ui/input'

type Decision='UPHOLD'|'CORRECT_SCORE'|'REPLAY'

export function AdminDisputeResolution({
  disputeId,
  homeClub,
  awayClub,
  homeScore,
  awayScore,
}:{
  disputeId:string
  homeClub:string
  awayClub:string
  homeScore:number|null
  awayScore:number|null
}){
  const router=useRouter()
  const[decision,setDecision]=useState<Decision|null>(null)
  const[reason,setReason]=useState('')
  const[correctedHome,setCorrectedHome]=useState(homeScore??0)
  const[correctedAway,setCorrectedAway]=useState(awayScore??0)
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState<string|null>(null)

  function open(next:Decision){
    setDecision(next)
    setReason('')
    setCorrectedHome(homeScore??0)
    setCorrectedAway(awayScore??0)
    setError(null)
  }

  async function execute(){
    if(!decision)return
    const resolution=reason.trim()
    if(resolution.length<5){setError('Indica o motivo da decisão com pelo menos 5 caracteres.');return}
    if(decision==='CORRECT_SCORE'&&(!Number.isInteger(correctedHome)||!Number.isInteger(correctedAway)||correctedHome<0||correctedAway<0)){
      setError('O resultado corrigido tem de usar valores inteiros não negativos.')
      return
    }

    setLoading(true);setError(null)
    try{
      const idempotencyKey=`admin-dispute:${disputeId}:${decision}:${crypto.randomUUID()}`
      const response=await fetch('/api/admin/competition',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          action:'resolve-dispute',
          disputeId,
          decision,
          resolution,
          idempotencyKey,
          homeScore:decision==='CORRECT_SCORE'?correctedHome:null,
          awayScore:decision==='CORRECT_SCORE'?correctedAway:null,
        }),
      })
      const payload=await response.json()
      if(!response.ok)throw new Error(payload.error||'dispute_resolution_failed')
      setDecision(null)
      router.refresh()
    }catch(e){
      setError(e instanceof Error?e.message:'dispute_resolution_failed')
    }finally{
      setLoading(false)
    }
  }

  const title=decision==='UPHOLD'?'Manter resultado submetido':decision==='CORRECT_SCORE'?'Corrigir resultado oficial':'Mandar repetir a partida'
  const description=decision==='UPHOLD'
    ?'A disputa será rejeitada e o resultado atual será liquidado imediatamente.'
    :decision==='CORRECT_SCORE'
      ?'O marcador definido pelo administrador torna-se oficial e é liquidado imediatamente.'
      :'O resultado é removido, a disputa é resolvida e a partida volta a READY para ser jogada novamente.'

  return <>
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="xs" variant="outline" onClick={()=>open('UPHOLD')}><CheckCircle2 className="h-3.5 w-3.5"/>Manter</Button>
      <Button size="xs" variant="secondary" onClick={()=>open('CORRECT_SCORE')}><PencilLine className="h-3.5 w-3.5"/>Corrigir</Button>
      <Button size="xs" variant="destructive" onClick={()=>open('REPLAY')}><RotateCcw className="h-3.5 w-3.5"/>Repetir</Button>
    </div>
    <ConfirmationDialog
      open={Boolean(decision)}
      onOpenChange={openState=>{if(!openState&&!loading)setDecision(null)}}
      title={title}
      description={description}
      confirmLabel={decision==='REPLAY'?'Mandar repetir':'Aplicar decisão'}
      tone={decision==='REPLAY'?'danger':'warning'}
      isLoading={loading}
      onConfirm={execute}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-sm">
          <div className="flex items-center justify-between gap-3"><span>{homeClub}</span><strong>{homeScore??'—'} — {awayScore??'—'}</strong><span className="text-right">{awayClub}</span></div>
        </div>
        {decision==='CORRECT_SCORE'&&<div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-xs text-muted-foreground">{homeClub}<Input type="number" min={0} step={1} value={correctedHome} onChange={event=>setCorrectedHome(Number(event.target.value))}/></label>
          <label className="space-y-1.5 text-xs text-muted-foreground">{awayClub}<Input type="number" min={0} step={1} value={correctedAway} onChange={event=>setCorrectedAway(Number(event.target.value))}/></label>
        </div>}
        <label className="block space-y-1.5 text-xs text-muted-foreground">Motivo administrativo
          <textarea
            value={reason}
            onChange={event=>setReason(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Explica a evidência analisada e a decisão tomada…"
            className="w-full rounded-[10px] border border-white/[.105] bg-[#0d0d0d] px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </label>
        {error&&<p className="rounded-lg border border-destructive/20 bg-destructive/[0.06] p-3 text-xs text-destructive">{error}</p>}
      </div>
    </ConfirmationDialog>
  </>
}
