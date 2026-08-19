'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel, Search, Store, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { MarketListingCard } from '@/components/market/market-listing-card'
import { PlatformPlayerCard } from '@/components/market/platform-player-card'
import type { MarketReadModel } from '@/lib/application/read-models'

type MarketMode = 'platform' | 'clubs'
type SortFilter = 'rating' | 'newest' | 'cheapest' | 'most_expensive'

const friendlyError: Record<string, string> = {
  platform_player_not_available: 'Este jogador já não está disponível na plataforma.',
  buyer_club_required: 'É necessário ter um clube neste universo.',
  buyer_silver_account_not_found: 'A conta Silver do clube ainda não está disponível.',
  insufficient_silver: 'O clube não tem Silver suficiente para esta contratação.',
  buyer_squad_capacity_exceeded: 'O plantel atingiu a capacidade máxima deste universo.',
  economic_scope_frozen: 'As operações económicas deste clube estão temporariamente bloqueadas.',
}

function messageFor(error: unknown) {
  const raw = error instanceof Error ? error.message : 'market_purchase_failed'
  const key = Object.keys(friendlyError).find(candidate => raw.includes(candidate))
  return key ? friendlyError[key] : 'Não foi possível concluir a operação. Atualiza a página e tenta novamente.'
}

export function MarketPageClient({ market }: { market: MarketReadModel }) {
  const router = useRouter()
  const [mode, setMode] = useState<MarketMode>('platform')
  const [search, setSearch] = useState('')
  const [sortFilter, setSortFilter] = useState<SortFilter>('rating')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const platformPlayers = useMemo(() => {
    const query = search.trim().toLowerCase()
    const items = market.platformPlayers.filter(entry => !query || [entry.player.name, entry.player.position, entry.player.nationality].filter(Boolean).some(value => String(value).toLowerCase().includes(query)))
    return [...items].sort((a, b) => {
      if (sortFilter === 'cheapest') return a.asset.platformPrice - b.asset.platformPrice
      if (sortFilter === 'most_expensive') return b.asset.platformPrice - a.asset.platformPrice
      return b.player.overall - a.player.overall || b.asset.platformPrice - a.asset.platformPrice
    })
  }, [market.platformPlayers, search, sortFilter])

  const listings = useMemo(() => {
    const query = search.trim().toLowerCase()
    const items = market.directListings.filter(entry => !query || [entry.player.name, entry.player.position, entry.player.nationality, entry.sellerClub.name].filter(Boolean).some(value => String(value).toLowerCase().includes(query)))
    return [...items].sort((a, b) => {
      if (sortFilter === 'cheapest') return (a.listing.askingPrice ?? 0) - (b.listing.askingPrice ?? 0)
      if (sortFilter === 'most_expensive') return (b.listing.askingPrice ?? 0) - (a.listing.askingPrice ?? 0)
      if (sortFilter === 'rating') return b.player.overall - a.player.overall
      return new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime()
    })
  }, [market.directListings, search, sortFilter])

  async function purchase(url: string, body: object, id: string) {
    setBuyingId(id)
    setError(null)
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'market_purchase_failed')
      router.refresh()
    } catch (caught) {
      setError(messageFor(caught))
    } finally {
      setBuyingId(null)
    }
  }

  function buyPlatformPlayer(universePlayerId: string) {
    return purchase('/api/market/platform-buy', { universePlayerId, idempotencyKey: `market-platform:${crypto.randomUUID()}` }, universePlayerId)
  }

  function buyListing(listingId: string) {
    return purchase('/api/market/direct-buy', { listingId, idempotencyKey: `market-direct:${crypto.randomUUID()}` }, listingId)
  }

  const visibleCount = mode === 'platform' ? platformPlayers.length : listings.length
  const sortOptions: Array<[SortFilter, string]> = mode === 'platform'
    ? [['rating', 'Melhor classificação'], ['cheapest', 'Preço mais baixo'], ['most_expensive', 'Preço mais alto']]
    : [['newest', 'Mais recentes'], ['rating', 'Melhor classificação'], ['cheapest', 'Preço mais baixo'], ['most_expensive', 'Preço mais alto']]

  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div><p className="clan-kicker">Mercado · {market.universe.name}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Reforça o plantel com jogadores reais.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Contrata jogadores disponíveis diretamente à plataforma por um preço fixo ou compra jogadores colocados à venda por outros clubes. Cada compra transfere o ativo e cria o contrato no teu clube numa única operação.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><CurrencyDisplay kind="silver" amount={market.silverBalance} label="Silver disponível" /><Button variant="outline" asChild><Link href={`/market/auction?universe=${market.universe.id}`}><Gavel className="h-4 w-4" />Leilões</Link></Button></div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>}

      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="clan-panel-neutral h-fit rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Origem</p>
          <div className="mt-3 grid gap-2">
            <Button type="button" variant={mode === 'platform' ? 'secondary' : 'ghost'} onClick={() => { setMode('platform'); setSortFilter('rating') }} className="justify-between"><span className="flex items-center gap-2"><Store className="h-4 w-4" />Plataforma</span><span>{market.platformPlayerCount}</span></Button>
            <Button type="button" variant={mode === 'clubs' ? 'secondary' : 'ghost'} onClick={() => { setMode('clubs'); setSortFilter('newest') }} className="justify-between"><span className="flex items-center gap-2"><Users className="h-4 w-4" />Clubes</span><span>{market.directListings.length}</span></Button>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pesquisar</p>
          <div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder={mode === 'platform' ? 'Jogador, posição ou país' : 'Jogador, posição ou clube'} className="pl-9" /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ordenar</p>
          <div className="mt-2 grid gap-2">{sortOptions.map(([value, label]) => <Button key={value} type="button" variant={sortFilter === value ? 'secondary' : 'ghost'} onClick={() => setSortFilter(value)} className="justify-start">{label}</Button>)}</div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{mode === 'platform' ? 'Jogadores da plataforma' : 'Venda entre clubes'}</p>
              <p className="text-xs text-muted-foreground">{visibleCount} resultado(s){mode === 'platform' && market.platformPlayerCount > market.platformPlayers.length ? ` · a mostrar ${market.platformPlayers.length} de ${market.platformPlayerCount}` : ''}</p>
            </div>
            {mode === 'clubs' && <Button variant="outline" asChild><Link href={`/team?universe=${market.universe.id}`}><Store className="h-4 w-4" />Vender jogador</Link></Button>}
          </div>

          {mode === 'platform' ? (
            platformPlayers.length === 0
              ? <EmptyMarket title="Nenhum jogador disponível" detail="Sincroniza e materializa o catálogo para este universo no painel de administração. Os jogadores de topo não entram no starter squad e ficam disponíveis aqui." />
              : <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{platformPlayers.map(entry => <PlatformPlayerCard key={entry.asset.id} entry={entry} silverBalance={market.silverBalance} buying={buyingId === entry.asset.id} onBuy={buyPlatformPlayer} />)}</div>
          ) : (
            listings.length === 0
              ? <EmptyMarket title="Nenhuma venda entre clubes" detail="Ajusta a pesquisa ou coloca um jogador do teu plantel no mercado." />
              : <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{listings.map(entry => <MarketListingCard key={entry.listing.id} entry={entry} ownClubId={market.buyerClub.id} buying={buyingId === entry.listing.id} onBuy={buyListing} />)}</div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#080808] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{market.auctionListings.length} leilões ativos</p><p className="mt-1 text-xs text-muted-foreground">As licitações reservam Silver e capacidade de plantel até ao encerramento.</p></div><Button variant="outline" asChild><Link href={`/market/auction?universe=${market.universe.id}`}><Gavel className="h-4 w-4" />Abrir leilões</Link></Button></section>
    </div>
  )
}

function EmptyMarket({ title, detail }: { title: string; detail: string }) {
  return <div className="clan-panel-neutral flex min-h-72 flex-col items-center justify-center rounded-2xl p-8 text-center"><Store className="h-9 w-9 text-primary/60" /><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 max-w-lg text-sm text-muted-foreground">{detail}</p></div>
}
