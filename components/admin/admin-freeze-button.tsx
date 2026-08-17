'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, UnlockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { FreezeScope } from '@/lib/domain/governance'

export function AdminFreezeButton({scope,targetId,freezeId=null,label}:{scope:FreezeScope;targetId:string;freezeId?:string|null;label?:string}){
  const router=useRouter();const[open,setOpen]=useState(false);const[reason,setReason]=useState('');const[loading,setLoading]=useState(false);const[error,setError]=useState<string|null>(null);const releasing=Boolean(freezeId)
  async function execute(){if(reason.trim().length<5){setError('Indica um motivo com pelo menos 5 caracteres.');return}setLoading(true);setError(null);try{const payload=releasing?{action:'freeze-release',freezeId,reason:reason.trim()}:{action:'freeze-create',scope,targetId,reason:reason.trim()};const r=await fetch('/api/admin/governance',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const p=await r.json();if(!r.ok)throw new Error(p.error||'freeze_operation_failed');setOpen(false);setReason('');router.refresh()}catch(e){setError(e instanceof Error?e.message:'freeze_operation_failed')}finally{setLoading(false)}}
  return <><Button size="sm" variant={releasing?'outline':'destructive'} onClick={()=>{setError(null);setOpen(true)}}>{releasing?<UnlockKeyhole className="mr-1.5 h-3.5 w-3.5"/>:<LockKeyhole className="mr-1.5 h-3.5 w-3.5"/>}{label??(releasing?'Libertar freeze':'Freeze económico')}</Button><ConfirmationDialog open={open} onOpenChange={o=>{if(!loading)setOpen(o)}} title={releasing?'Libertar bloqueio económico':'Criar bloqueio económico'} description={releasing?'As operações económicas voltam a ficar disponíveis.':'O histórico é preservado, mas operações económicas ficam bloqueadas para este scope.'} confirmLabel={releasing?'Libertar':'Aplicar freeze'} tone={releasing?'warning':'danger'} isLoading={loading} onConfirm={execute}><label className="text-xs font-bold text-muted-foreground">Motivo obrigatório</label><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/[.08] bg-[#111] px-3.5 py-3 text-sm outline-none focus:border-primary/55"/>{error&&<p className="mt-2 text-xs text-destructive">{error}</p>}</ConfirmationDialog></>
}
