'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export function FinanceClubClient({ clubId, clubName, goldBalance, financingPolicy }: { clubId:string; clubName:string; goldBalance:number; financingPolicy:string }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const value = Number(amount)
  const disabled = financingPolicy === 'DISABLED' || goldBalance <= 0

  const submit = async () => {
    if (!Number.isSafeInteger(value) || value <= 0 || value > goldBalance) return
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/economy/finance-club', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ clubId, goldAmount:value, idempotencyKey:`gold_financing_${clubId}_${crypto.randomUUID()}` }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'financing_failed')
      setMessage(`${Number(payload.goldSpent).toLocaleString('pt-PT')} Gold financiaram ${Number(payload.silverCredited).toLocaleString('pt-PT')} Silver.`)
      setAmount('')
      setOpen(false)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível financiar o clube.')
    } finally { setLoading(false) }
  }

  return <section className="rounded-2xl border border-primary/15 bg-primary/[0.025] p-5 sm:p-6">
    <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] text-primary"><ArrowRightLeft className="h-4 w-4" /></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Financiamento Gold → Silver</p><h2 className="mt-1 text-xl font-black">Capitalizar {clubName}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Isto não é câmbio livre. É uma operação de financiamento sujeita à política do universo, limites da plataforma, saldo disponível e economic freezes.</p></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="gold-financing">Gold a aplicar</Label><Input id="gold-financing" type="number" min="1" max={goldBalance} step="1" value={amount} onChange={event => setAmount(event.target.value)} disabled={disabled || loading} placeholder="0" /></div><Button disabled={disabled || loading || !Number.isSafeInteger(value) || value <= 0 || value > goldBalance} onClick={() => setOpen(true)}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}Financiar clube</Button></div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>Saldo: {goldBalance.toLocaleString('pt-PT')} Gold</span><span>Política: {financingPolicy}</span><span>A taxa final é validada pelo servidor</span></div>
    {message && <p className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-sm text-muted-foreground">{message}</p>}
    <ConfirmationDialog open={open} onOpenChange={setOpen} title="Confirmar financiamento" description={`Aplicar ${Number.isFinite(value) ? value.toLocaleString('pt-PT') : '0'} Gold no clube ${clubName}?`} confirmLabel="Confirmar financiamento" isLoading={loading} onConfirm={submit}><p className="text-sm leading-6 text-muted-foreground">A quantidade de Silver é calculada e validada no RPC oficial. A operação é idempotente, auditada no ledger e pode ser recusada por limites ou freezes.</p></ConfirmationDialog>
  </section>
}
