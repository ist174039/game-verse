'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel, ShieldCheck, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MarketListingCard } from '@/components/market/market-listing-card'
import type { MarketListingReadModel, MarketReadModel } from '@/lib/application/read-models'

export function AuctionClient({ market }: { market: MarketReadModel }) {
  const router = useRouter()
  const [selected, setSelected] = useState<MarketListingReadModel | null>(null)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestedMinimum = useMemo(() => {
    if (!selected) return 0
    if (selected.highestBid != null) return selected.highestBid + 1
    return Math.max(1, selected.listing.askingPrice ?? selected.listing.buyNowPrice ?? 1)
  }, [selected])

  function openBid(entry: MarketListingReadModel) {
    setError(null)
    setSelected(entry)
    setAmount(String(entry.highestBid != null ? entry.highestBid + 1 : Math.max(1, entry.listing.askingPrice ?? entry.listing.buyNowPrice ?? 1)))
  }

  async function placeBid() {
    if (!selected) return
    const numericAmount = Number(amount)
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      setError('O valor tem de ser um número inteiro positivo de Silver.')
      return
    }

    setSubmitting(true); setError(null)
    try {
      const response = await fetch('/api/market/auction-bid', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ listingId: selected.listing.id, amount: numericAmount, idempotencyKey: `auction-bid:${crypto.randomUUID()}` }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'auction_bid_failed')
      setSelected(null); router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível registar a licitação.') }
    finally { setSubmitting(false) }
  }

  return (
    <>
      {error && !selected && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">Licitação recusada: {error}</div>}
      {market.auctionListings.length === 0 ? (
        <div className="clan-panel-neutral flex min-h-72 flex-col items-center justify-center rounded-2xl p-8 text-center"><Gavel className="h-10 w-10 text-primary/45" /><h2 className="mt-4 text-xl font-black">Sem leilões ativos</h2><p className="mt-2 text-sm text-muted-foreground">Quando uma listagem AUCTION estiver ativa neste universo, aparece aqui automaticamente.</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {market.auctionListings.map(entry => (
            <div key={entry.listing.id} className="space-y-2">
              <MarketListingCard entry={entry} ownClubId={market.buyerClub.id} />
              <Button className="w-full" variant="outline" disabled={entry.listing.sellerClubId === market.buyerClub.id} onClick={() => openBid(entry)}>
                <Gavel className="h-4 w-4" />{entry.listing.sellerClubId === market.buyerClub.id ? 'Teu leilão' : 'Licitar'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog open={selected !== null} onOpenChange={open => !open && !submitting && setSelected(null)} title={selected ? `Licitar por ${selected.player.name}` : 'Licitar'} description="O valor vencedor fica reservado em escrow Silver até ser superado, libertado ou liquidado." confirmLabel="Confirmar licitação" tone="warning" isLoading={submitting} onConfirm={placeBid}>
        {selected && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs">
            <div><p className="text-muted-foreground">Maior bid atual</p><p className="mt-1 font-bold">{(selected.highestBid ?? 0).toLocaleString('pt-PT')} S</p></div>
            <div><p className="text-muted-foreground">Saldo visível</p><p className="mt-1 font-bold">{market.silverBalance.toLocaleString('pt-PT')} S</p></div>
          </div>
          <div><label htmlFor="auction-bid-amount" className="text-xs font-semibold">Valor da licitação</label><Input id="auction-bid-amount" className="mt-2" inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value.replace(/[^0-9]/g, ''))} /></div>
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Sugestão mínima visual: {suggestedMinimum.toLocaleString('pt-PT')} S. O backend continua a ser a autoridade final sobre mínimo, saldo, escrow e estado do leilão.</p>
          {error && <p className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.05] p-3 text-xs text-red-300"><ShieldCheck className="h-4 w-4 shrink-0" />{error}</p>}
        </div>}
      </ConfirmationDialog>
    </>
  )
}
