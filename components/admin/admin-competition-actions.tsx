'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export function AdminCompetitionActions({competitionId,status}:{competitionId:string;status:string}){
  const router=useRouter();const[action,setAction]=useState<'activate'|'progress'|null>(null);const[loading,setLoading]=useState(false);const[error,setError]=useState<string|null>(null)
  const canActivate=['DRAFT','REGISTRATION','OPEN','SCHEDULED'].includes(status)
  const canProgress=status==='ACTIVE'
  async function execute(){if(!action)return;setLoading(true);setError(null);try{const response=await fetch('/api/admin/competition',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,competitionId,roundIntervalDays:7})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'competition_operation_failed');setAction(null);router.refresh()}catch(e){setError(e instanceof Error?e.message:'competition_operation_failed')}finally{setLoading(false)}}
  if(!canActivate&&!canProgress)return <span className="text-xs text-muted-foreground">—</span>
  return <><div className="flex justify-end gap-2">{canActivate&&<Button size="sm" onClick={()=>{setError(null);setAction('activate')}}><CalendarClock className="mr-1.5 h-3.5 w-3.5"/>Ativar</Button>}{canProgress&&<Button size="sm" variant="outline" onClick={()=>{setError(null);setAction('progress')}}><RefreshCw className="mr-1.5 h-3.5 w-3.5"/>Processar</Button>}</div><ConfirmationDialog open={Boolean(action)} onOpenChange={o=>{if(!o&&!loading)setAction(null)}} title={action==='activate'?'Ativar competição e gerar calendário':'Processar progressão competitiva'} description={action==='activate'?'As inscrições aprovadas tornam-se participantes e o calendário é criado de forma idempotente.':'Recalcula standings, fecha rounds, avança a Taça e liquida o prémio quando a competição terminar.'} confirmLabel={action==='activate'?'Gerar calendário':'Processar agora'} tone="warning" isLoading={loading} onConfirm={execute}>{error&&<p className="text-xs text-destructive">{error}</p>}</ConfirmationDialog></>
}
