'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Gavel, LockKeyhole, Search, SlidersHorizontal, Store, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { MarketListingCard } from '@/components/market/market-listing-card'
import type { MarketListingWithSeller } from '@/lib/types'

type SortFilter = 'newest' | 'cheapest' | 'most_expensive'

interface MarketPageClientProps {
  listings: MarketListingWithSeller[]
  userId: string
  balance: number
}

export function MarketPageClient({ listings, userId, balance }: MarketPageClientProps) {
  const [search, setSearch] = useState('')
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = listings.filter((listing) => {
      if (!query) return true
      return [listing.card_name, listing.card_type, listing.description, listing.seller?.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })

    if (sortFilter === 'cheapest') result.sort((a, b) => a.price - b.price)
    else if (sortFilter === 'most_expensive') result.sort((a, b) => b.price - a.price)
    else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return result
  }, [listings, search, sortFilter])

  return (
    <div className="space-y-7">
      <section className="brand-watermark overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="clan-kicker">Mercado do universo</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">Constrói o plantel. Gere o capital.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Compra e vende ativos desportivos dentro do universo. O mercado definitivo usará jogadores canónicos, propriedade única por universo e liquidação Silver através do ledger.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <CurrencyDisplay kind="silver" amount={balance} label="Silver disponível" />
            <Button variant="outline" asChild className="min-h-11 border-white/10 bg-white/[0.02] px-4">
              <Link href="/market/auction"><Gavel className="h-4 w-4" />Leilões</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MarketMetric label="Ativos disponíveis" value={listings.length.toLocaleString('pt-PT')} detail="Listagens atualmente visíveis" />
        <MarketMetric label="Resultados" value={filteredListings.length.toLocaleString('pt-PT')} detail="Depois da pesquisa e ordenação" />
        <MarketMetric label="Motor económico" value="Silver" detail="GameCoins removido da experiência" accent />
      </section>

      <div className="flex items-center gap-2 xl:hidden">
        <Button variant="outline" className="w-full justify-between" onClick={() => setFiltersOpen(true)}>
          <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Filtros e ordenação</span>
          <span className="text-xs font-medium text-muted-foreground">{filteredListings.length}</span>
        </Button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden space-y-4 xl:block">
          <div className="clan-panel-neutral rounded-2xl p-4">
            <MarketFilters search={search} setSearch={setSearch} sortFilter={sortFilter} setSortFilter={setSortFilter} />
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
            <div className="flex items-center gap-2 text-primary"><LockKeyhole className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Transações protegidas</span></div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Compras e vendas do modelo legado estão bloqueadas até o ledger Silver e a propriedade de jogador por universo estarem ativos.</p>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-foreground">Mercado disponível</p><p className="text-xs text-muted-foreground">{filteredListings.length} resultados</p></div>
            <Button disabled className="w-full sm:w-auto"><WalletCards className="h-4 w-4" />Colocar à venda</Button>
          </div>

          {filteredListings.length === 0 ? (
            <div className="clan-panel-neutral flex min-h-72 flex-col items-center justify-center rounded-2xl p-8 text-center">
              <Store className="h-9 w-9 text-primary/60" />
              <h2 className="mt-4 text-lg font-semibold">Nenhum ativo encontrado</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Ajusta a pesquisa ou aguarda novas listagens neste universo.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredListings.map((listing) => <MarketListingCard key={listing.id} listing={listing} userId={userId} />)}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#080808] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold">Leilões fazem parte do mesmo mercado.</p><p className="mt-1 text-xs text-muted-foreground">Escrow, licitação e settlement serão atómicos no novo domínio económico.</p></div>
        <Button variant="outline" asChild className="w-full sm:w-auto"><Link href="/market/auction">Abrir leilões <ArrowRight className="h-4 w-4" /></Link></Button>
      </section>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtros do mercado</DialogTitle>
            <DialogDescription>Pesquisa e ordena as listagens sem perder o contexto da página.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <MarketFilters search={search} setSearch={setSearch} sortFilter={sortFilter} setSortFilter={setSortFilter} />
            <div className="mt-5 rounded-xl border border-primary/15 bg-primary/[0.035] p-4">
              <div className="flex items-center gap-2 text-primary"><LockKeyhole className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Transações protegidas</span></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Compras e vendas só serão ativadas quando o ledger Silver e a propriedade de jogador por universo estiverem ligados.</p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSearch(''); setSortFilter('newest') }}>Limpar</Button>
            <Button onClick={() => setFiltersOpen(false)}>Ver {filteredListings.length} resultados</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MarketFilters({
  search,
  setSearch,
  sortFilter,
  setSortFilter,
}: {
  search: string
  setSearch: (value: string) => void
  sortFilter: SortFilter
  setSortFilter: (value: SortFilter) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pesquisar mercado</p>
      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Jogador, tipo ou vendedor" className="pl-9" />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ordenar por</p>
      <div className="mt-2 grid gap-2">
        {([
          ['newest', 'Mais recentes'],
          ['cheapest', 'Preço mais baixo'],
          ['most_expensive', 'Preço mais alto'],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={sortFilter === value ? 'secondary' : 'ghost'}
            onClick={() => setSortFilter(value)}
            className={sortFilter === value ? 'justify-start border-primary/20 bg-primary/[.08] text-primary' : 'justify-start'}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function MarketMetric({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="border-t border-white/[0.08] px-1 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-black ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}
