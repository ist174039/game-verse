'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

const competitionErrorMessages:Record<string,string>={
  competition_requires_two_participants:'São necessários pelo menos 2 clubes inscritos para gerar o calendário.',
  competition_schedule_already_exists:'Esta competição já tem um calendário criado.',
  competition_not_activatable:'O estado atual desta competição não permite ativação.',
  competition_type_not_schedulable:'Este formato não suporta geração automática de calendário.',
  competition_runtime_not_migrated:'O runtime de competições ainda não está alinhado com a base de dados.',
  competition_runtime_schema_mismatch:'O runtime do calendário está incompatível com o schema da base de dados. A migration 00520 tem de estar aplicada.',
  competition_not_found:'A competição já não existe.',
  competition_already_completed:'Esta competição já está concluída.',
  invalid_round_interval:'O intervalo entre jornadas é inválido.',
  competition_operation_failed:'Não foi possível concluir a operação competitiva.',
}

function readableCompetitionError(code:string){return competitionErrorMessages[code]??competitionErrorMessages.competition_operation_failed}

export function AdminCompetitionActions({competitionId,status}:{competitionId:string;status:string}){
  const router=useRouter();const[action,setAction]=useState<'activate'|'progress'|null>(null);const[loading,setLoading]=useState(false);const[error,setError]=useState<string|null>(null)
  const canActivate=['DRAFT','REGISTRATION','OPEN','SCHEDULED'].includes(status)
  const canProgress=status==='ACTIVE'
  async function execute(){if(!action)return;setLoading(true);setError(null);try{const response=await fetch('/api/admin/competition',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,competitionId,roundIntervalDays:7})});const payload=await response.json() as {error?:string};if(!response.ok)throw new Error(payload.error||'competition_operation_failed');setAction(null);router.refresh()}catch(e){const code=e instanceof Error?e.message:'competition_operation_failed';setError(readableCompetitionError(code))}finally{setLoading(false)}}
  if(!canActivate&&!canProgress)return <span className="text-xs text-muted-foreground">—</span>
  return <><div className="flex justify-end gap-2">{canActivate&&<Button size="sm" onClick={()=>{setError(null);setAction('activate')}}><CalendarClock className="mr-1.5 h-3.5 w-3.5"/>Ativar</Button>}{canProgress&&<Button size="sm" variant="outline" onClick={()=>{setError(null);setAction('progress')}}><RefreshCw className="mr-1.5 h-3.5 w-3.5"/>Processar</Button>}</div><ConfirmationDialog open={Boolean(action)} onOpenChange={o=>{if(!o&&!loading)setAction(null)}} title={action==='activate'?'Ativar competição e gerar calendário':'Processar progressão competitiva'} description={action==='activate'?'É necessário existirem pelo menos 2 clubes inscritos. As inscrições válidas tornam-se participantes e o calendário é criado de forma idempotente.':'Recalcula standings, fecha rounds, avança a Taça e liquida o prémio quando a competição terminar.'} confirmLabel={action==='activate'?'Gerar calendário':'Processar agora'} tone="warning" isLoading={loading} onConfirm={execute}>{error&&<p className="text-xs leading-5 text-destructive">{error}</p>}</ConfirmationDialog></>
}
