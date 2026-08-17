'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Gavel, Search, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { MarketListingCard } from '@/components/market/market-listing-card'
import type { MarketReadModel } from '@/lib/application/read-models'

type SortFilter = 'newest' | 'cheapest' | 'most_expensive'

export function MarketPageClient({ market }: { market: MarketReadModel }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const listings = useMemo(() => {
    const query = search.trim().toLowerCase()
    const items = market.directListings.filter(entry => !query || [entry.player.name, entry.player.position, entry.player.nationality, entry.sellerClub.name].filter(Boolean).some(value => String(value).toLowerCase().includes(query)))
    return [...items].sort((a, b) => {
      if (sortFilter === 'cheapest') return (a.listing.askingPrice ?? 0) - (b.listing.askingPrice ?? 0)
      if (sortFilter === 'most_expensive') return (b.listing.askingPrice ?? 0) - (a.listing.askingPrice ?? 0)
      return new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime()
    })
  }, [market.directListings, search, sortFilter])

  async function buy(listingId: string) {
    setBuyingId(listingId); setError(null)
    try {
      const response = await fetch('/api/market/direct-buy', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ listingId, idempotencyKey: `market-direct:${crypto.randomUUID()}` }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'market_purchase_failed')
      router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível concluir a compra.') }
    finally { setBuyingId(null) }
  }

  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div><p className="clan-kicker">Mercado · {market.universe.name}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Constrói o plantel. Gere o capital.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Cada listagem representa um UNIVERSE_PLAYER real. A compra transfere propriedade, debita Silver, aplica fee do universo e liquida o vendedor atomicamente.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><CurrencyDisplay kind="silver" amount={market.silverBalance} label="Silver disponível" /><Button variant="outline" asChild><Link href={`/market/auction?universe=${market.universe.id}`}><Gavel className="h-4 w-4" />Leilões</Link></Button></div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">A operação foi recusada: {error}</div>}

      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="clan-panel-neutral h-fit rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pesquisar</p>
          <div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Jogador, posição ou clube" className="pl-9" /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ordenar</p>
          <div className="mt-2 grid gap-2">{([['newest','Mais recentes'],['cheapest','Preço mais baixo'],['most_expensive','Preço mais alto']] as const).map(([value,label]) => <Button key={value} type="button" variant={sortFilter === value ? 'secondary' : 'ghost'} onClick={() => setSortFilter(value)} className="justify-start">{label}</Button>)}</div>
        </aside>

        <div>
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold">Venda direta</p><p className="text-xs text-muted-foreground">{listings.length} listagens</p></div><Button disabled>Colocar à venda</Button></div>
          {listings.length === 0 ? <div className="clan-panel-neutral flex min-h-72 flex-col items-center justify-center rounded-2xl p-8 text-center"><Store className="h-9 w-9 text-primary/60" /><h2 className="mt-4 text-lg font-semibold">Nenhuma listagem encontrada</h2><p className="mt-2 text-sm text-muted-foreground">Ajusta a pesquisa ou aguarda novas vendas neste universo.</p></div> : <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{listings.map(entry => <MarketListingCard key={entry.listing.id} entry={entry} ownClubId={market.buyerClub.id} buying={buyingId === entry.listing.id} onBuy={buy} />)}</div>}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#080808] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{market.auctionListings.length} leilões ativos</p><p className="mt-1 text-xs text-muted-foreground">Bids usam escrow Silver real e settlement atómico.</p></div><Button variant="outline" asChild><Link href={`/market/auction?universe=${market.universe.id}`}>Abrir leilões <ArrowRight className="h-4 w-4" /></Link></Button></section>
    </div>
  )
}
