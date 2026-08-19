'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel, Store, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ListingMode = 'DIRECT' | 'AUCTION'

interface PlayerMarketActionProps {
  universePlayerId: string
  playerName: string
  status: string
  marketReferenceValue: number
}

function friendlyError(message: string) {
  if (message.includes('competitive_roster_minimum_protected')) return 'Esta operação deixaria o clube abaixo do plantel mínimo exigido enquanto tens um compromisso competitivo ativo.'
  if (message.includes('player_locked_in_pending_lineup')) return 'Este jogador está num onze guardado para uma partida pendente. Altera primeiro o onze dessa partida.'
  if (message.includes('auction_with_bids_cannot_be_cancelled')) return 'O leilão já tem uma proposta válida e já não pode ser cancelado.'
  if (message.includes('player_already_listed')) return 'Este jogador já está no mercado.'
  if (message.includes('economic_scope_frozen')) return 'As operações económicas deste clube estão temporariamente bloqueadas.'
  return message
}

export function PlayerMarketAction({ universePlayerId, playerName, status, marketReferenceValue }: PlayerMarketActionProps) {
  const router = useRouter()
  const listed = status === 'LISTED' || status === 'AUCTION'
  const [open, setOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [mode, setMode] = useState<ListingMode>('DIRECT')
  const [askingPrice, setAskingPrice] = useState(String(Math.max(1, Math.round(marketReferenceValue))))
  const [buyNowPrice, setBuyNowPrice] = useState('')
  const [durationHours, setDurationHours] = useState('24')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createListing() {
    const asking = Number(askingPrice)
    const buyNow = buyNowPrice.trim() ? Number(buyNowPrice) : null
    const duration = Number(durationHours)
    if (!Number.isSafeInteger(asking) || asking <= 0) { setError('Define um preço inteiro superior a zero.'); return }
    if (mode === 'AUCTION' && (!Number.isSafeInteger(duration) || duration < 1 || duration > 168)) { setError('A duração do leilão deve estar entre 1 e 168 horas.'); return }
    if (mode === 'AUCTION' && buyNow != null && (!Number.isSafeInteger(buyNow) || buyNow < asking)) { setError('O preço de compra imediata não pode ser inferior ao preço inicial.'); return }

    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/market/create-listing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          universePlayerId,
          listingType: mode,
          askingPrice: asking,
          buyNowPrice: buyNow,
          durationHours: duration,
          idempotencyKey: `listing:${crypto.randomUUID()}`,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'create_listing_failed')
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(friendlyError(cause instanceof Error ? cause.message : 'Não foi possível criar a listagem.'))
    } finally { setLoading(false) }
  }

  async function cancelListing() {
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/market/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ universePlayerId, idempotencyKey: `cancel-listing:${crypto.randomUUID()}` }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'cancel_listing_failed')
      setCancelOpen(false)
      router.refresh()
    } catch (cause) {
      setError(friendlyError(cause instanceof Error ? cause.message : 'Não foi possível retirar a listagem.'))
    } finally { setLoading(false) }
  }

  if (listed) {
    return <div className="mt-2">
      <Button size="sm" variant="outline" width="full" onClick={() => { setError(null); setCancelOpen(true) }}>
        <X className="h-3.5 w-3.5" />Retirar do mercado
      </Button>
      <ConfirmationDialog open={cancelOpen} onOpenChange={setCancelOpen} title="Retirar jogador do mercado" description={status === 'AUCTION' ? 'Se o leilão já tiver uma proposta válida, a operação será recusada.' : 'A listagem será cancelada e o jogador regressa ao estado operacional anterior.'} confirmLabel="Retirar" tone="warning" isLoading={loading} onConfirm={cancelListing}>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </ConfirmationDialog>
    </div>
  }

  return <div className="mt-2">
    <Button size="sm" variant="outline" width="full" onClick={() => { setError(null); setOpen(true) }}><Store className="h-3.5 w-3.5" />Colocar no mercado</Button>
    <Dialog open={open} onOpenChange={value => { if (!loading) setOpen(value) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colocar {playerName} no mercado</DialogTitle>
          <DialogDescription>O sistema valida automaticamente plantel mínimo, onzes pendentes e compromissos competitivos antes de aceitar a operação.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Tipo</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button type="button" variant={mode === 'DIRECT' ? 'secondary' : 'outline'} onClick={() => setMode('DIRECT')}><Store className="h-3.5 w-3.5" />Venda direta</Button>
                <Button type="button" variant={mode === 'AUCTION' ? 'secondary' : 'outline'} onClick={() => setMode('AUCTION')}><Gavel className="h-3.5 w-3.5" />Leilão</Button>
              </div>
            </div>
            <div><label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{mode === 'DIRECT' ? 'Preço' : 'Preço inicial'} · Silver</label><Input className="mt-2" type="number" min={1} step={1} value={askingPrice} onChange={event => setAskingPrice(event.target.value)} /></div>
            {mode === 'AUCTION' && <>
              <div><label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Compra imediata · opcional</label><Input className="mt-2" type="number" min={1} step={1} value={buyNowPrice} onChange={event => setBuyNowPrice(event.target.value)} placeholder="Sem compra imediata" /></div>
              <div><label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Duração · horas</label><Input className="mt-2" type="number" min={1} max={168} step={1} value={durationHours} onChange={event => setDurationHours(event.target.value)} /></div>
            </>}
            <p className="text-xs leading-5 text-muted-foreground">Valor de referência atual: <strong className="text-foreground">{marketReferenceValue.toLocaleString('pt-PT')} S</strong>. O valor de referência não limita o preço pedido.</p>
            {error && <p className="rounded-lg border border-destructive/20 bg-destructive/[0.05] p-3 text-xs text-destructive">{error}</p>}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={createListing} disabled={loading}>{loading ? 'A publicar…' : mode === 'DIRECT' ? 'Publicar venda' : 'Iniciar leilão'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}
