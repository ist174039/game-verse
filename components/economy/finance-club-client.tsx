'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { GoldFinancingStatus } from '@/lib/domain/club-economy'

const financingErrors: Record<string, string> = {
  financing_cycle_limit_exceeded: 'O limite de financiamento deste ciclo já não permite esse valor.',
  financing_operation_limit_exceeded: 'O valor ultrapassa o máximo permitido por operação.',
  financing_minimum_not_met: 'O valor está abaixo do mínimo permitido.',
  insufficient_gold: 'O saldo Gold não é suficiente.',
  economic_scope_frozen: 'As operações económicas deste clube estão temporariamente bloqueadas.',
  gold_financing_disabled: 'O financiamento Gold está desativado neste universo.',
  financing_disabled_in_universe: 'O financiamento está desativado neste universo.',
}

function readableError(code: unknown) {
  const value = typeof code === 'string' ? code : ''
  const match = Object.keys(financingErrors).find(key => value.includes(key))
  return match ? financingErrors[match] : 'Não foi possível financiar o clube.'
}

export function FinanceClubClient({ clubId, clubName, goldBalance, financingStatus }: { clubId:string; clubName:string; goldBalance:number; financingStatus:GoldFinancingStatus }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const value = Number(amount)
  const maximumNow = Math.max(0, Math.min(goldBalance, financingStatus.maxGoldPerOperation, financingStatus.remainingGoldThisCycle))
  const disabled = !financingStatus.enabled || maximumNow <= 0
  const validAmount = Number.isSafeInteger(value) && value > 0 && value <= maximumNow
  const usagePct = financingStatus.maxGoldPerCycle > 0
    ? Math.min(100, Math.round(financingStatus.spentGoldThisCycle / financingStatus.maxGoldPerCycle * 100))
    : 100
  const silverPreview = Number.isSafeInteger(value) && value > 0 ? value * financingStatus.silverPerGold : 0
  const resetsAt = new Date(financingStatus.resetsAt)

  const submit = async () => {
    if (!validAmount) return
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/economy/finance-club', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({ clubId, goldAmount:value, idempotencyKey:`gold_financing_${clubId}_${crypto.randomUUID()}` }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'financing_failed')
      setMessage(`${Number(payload.goldSpent).toLocaleString('pt-PT')} Gold financiaram ${Number(payload.silverCredited).toLocaleString('pt-PT')} Silver. Restam ${Number(payload.cycleGoldRemaining).toLocaleString('pt-PT')} Gold neste ciclo.`)
      setAmount('')
      setOpen(false)
      router.refresh()
    } catch (error) {
      setMessage(readableError(error instanceof Error ? error.message : error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-primary/15 bg-primary/[0.025] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] text-primary"><ArrowRightLeft className="h-4 w-4" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Financiamento Gold → Silver</p>
          <h2 className="mt-1 text-xl font-black">Capitalizar {clubName}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">A conversão é limitada por clube e por ciclo. Dividir o valor em várias operações não aumenta o limite.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4 sm:grid-cols-3">
        <Limit label="Taxa protegida" value={`1 Gold = ${financingStatus.silverPerGold.toLocaleString('pt-PT')} Silver`} />
        <Limit label="Disponível neste ciclo" value={`${financingStatus.remainingGoldThisCycle.toLocaleString('pt-PT')} Gold`} />
        <Limit label="Próxima renovação" value={Number.isNaN(resetsAt.getTime()) ? '—' : resetsAt.toLocaleString('pt-PT', { dateStyle:'short', timeStyle:'short' })} />
        <div className="sm:col-span-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>Utilização do ciclo</span><span>{financingStatus.spentGoldThisCycle.toLocaleString('pt-PT')} / {financingStatus.maxGoldPerCycle.toLocaleString('pt-PT')} Gold</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width:`${usagePct}%` }} /></div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="gold-financing">Gold a aplicar</Label>
          <Input id="gold-financing" type="number" min="1" max={maximumNow} step="1" value={amount} onChange={event => setAmount(event.target.value)} disabled={disabled || loading} placeholder={maximumNow > 0 ? `Máximo ${maximumNow}` : 'Limite atingido'} />
        </div>
        <Button disabled={disabled || loading || !validAmount} onClick={() => setOpen(true)}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{disabled ? 'Limite atingido' : 'Financiar clube'}</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>Saldo: {goldBalance.toLocaleString('pt-PT')} Gold</span><span>Política: {financingStatus.financingPolicy}</span><span>Máximo agora: {maximumNow.toLocaleString('pt-PT')} Gold</span></div>
      {message && <p className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-sm text-muted-foreground">{message}</p>}

      <ConfirmationDialog open={open} onOpenChange={setOpen} title="Confirmar financiamento" description={`Aplicar ${Number.isFinite(value) ? value.toLocaleString('pt-PT') : '0'} Gold no clube ${clubName}?`} confirmLabel="Confirmar financiamento" isLoading={loading} onConfirm={submit}>
        <div className="space-y-3 text-sm">
          <p className="leading-6 text-muted-foreground">A operação credita <strong className="text-foreground">{silverPreview.toLocaleString('pt-PT')} Silver</strong>. O valor conta para o limite semanal e fica auditado no ledger.</p>
          <div className="flex items-center justify-between rounded-lg border border-white/[0.07] px-3 py-2"><span className="text-muted-foreground">Limite restante depois</span><span className="font-black">{Math.max(0, financingStatus.remainingGoldThisCycle-value).toLocaleString('pt-PT')} Gold</span></div>
        </div>
      </ConfirmationDialog>
    </section>
  )
}

function Limit({ label, value }: { label:string; value:string }) {
  return <div><p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>
}
