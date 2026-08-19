'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { SponsorshipContract } from '@/lib/domain/club-economy'

export function SponsorshipOperationsClient({ clubId, contracts }: { clubId: string; contracts: SponsorshipContract[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<SponsorshipContract | null>(null)
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const offered = contracts.filter(contract => contract.state === 'OFFERED')
  const active = contracts.filter(contract => contract.state === 'ACTIVE')

  async function requestOffer() {
    setRequesting(true)
    setError(null)
    try {
      const response = await fetch('/api/economy/sponsorship/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clubId }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'sponsorship_request_failed')
      router.refresh()
    } catch {
      setError('Não foi possível gerar a oferta comercial. Tenta novamente.')
    } finally {
      setRequesting(false)
    }
  }

  async function accept() {
    if (!pending) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/economy/sponsorship/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contractId: pending.id, idempotencyKey: crypto.randomUUID() }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'sponsorship_accept_failed')
      setPending(null)
      router.refresh()
    } catch {
      setError('Não foi possível aceitar o patrocínio. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex items-center gap-2"><Handshake className="h-5 w-5 text-primary" /><h2 className="text-xl font-black">Patrocínios</h2></div>
      {error && <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/[.06] px-3 py-2 text-xs text-destructive">{error}</p>}
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {active.map(contract => <Card key={contract.id} contract={contract} active />)}
        {offered.map(contract => <Card key={contract.id} contract={contract} action={<Button size="sm" onClick={() => { setError(null); setPending(contract) }}>Aceitar oferta</Button>} />)}
        {active.length === 0 && offered.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-8 text-center">
            <p className="max-w-lg text-sm text-muted-foreground">Este clube ainda não tem uma oferta comercial. Podes gerar uma agora; não é necessário esperar pelo ciclo diário.</p>
            <Button className="mt-4" variant="outline" disabled={requesting} onClick={requestOffer}>{requesting ? 'A gerar oferta…' : 'Gerar oferta de patrocínio'}</Button>
          </div>
        )}
      </div>
      <ConfirmationDialog open={Boolean(pending)} onOpenChange={open => { if (!open && !loading) setPending(null) }} title="Aceitar patrocínio" description="O signing bonus entra imediatamente em Silver pelo ledger. O pagamento periódico entra nos ciclos financeiros seguintes." confirmLabel="Assinar contrato" isLoading={loading} onConfirm={accept}>
        {pending && <div className="space-y-2 rounded-xl border border-white/[.06] p-3 text-sm"><Row label="Signing bonus" value={`${pending.signingBonus.toLocaleString('pt-PT')} S`} /><Row label="Pagamento por ciclo" value={`${pending.periodicPayment.toLocaleString('pt-PT')} S`} /><Row label="Bónus objetivo" value={`${pending.objectiveBonus.toLocaleString('pt-PT')} S`} /></div>}
      </ConfirmationDialog>
    </section>
  )
}

function Card({ contract, active = false, action }: { contract: SponsorshipContract; active?: boolean; action?: React.ReactNode }) {
  return <article className={`rounded-xl border p-4 ${active ? 'border-primary/15 bg-primary/[.025]' : 'border-white/[.06]'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black">{contract.name}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{contract.state}</p></div>{action}</div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><Row label="Assinatura" value={`${contract.signingBonus.toLocaleString('pt-PT')} S`} /><Row label="Periódico" value={`${contract.periodicPayment.toLocaleString('pt-PT')} S`} /></div></article>
}

function Row({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-1 font-black tabular-nums">{value}</p></div>
}
