'use client'

import { useState, useMemo } from 'react'
import { Store, Plus, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketListingCard } from '@/components/market/market-listing-card'
import { MarketFilters } from '@/components/market/market-filters'
import type { MarketListingWithSeller } from '@/lib/types'

type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary'
type SortFilter = 'newest' | 'cheapest' | 'most_expensive' | 'rarest'

interface MarketPageClientProps {
  listings: MarketListingWithSeller[]
  userId: string
  balance: number
}

export function MarketPageClient({ listings, userId, balance }: MarketPageClientProps) {
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest')

  const filteredListings = useMemo(() => {
    let result = [...listings]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.card_name.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.card_type?.toLowerCase().includes(q)
      )
    }

    if (rarityFilter !== 'all') {
      result = result.filter((l) => l.card_rarity === rarityFilter)
    }

    switch (sortFilter) {
      case 'cheapest':
        result.sort((a, b) => a.price - b.price)
        break
      case 'most_expensive':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rarest': {
        const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 }
        result.sort((a, b) => rarityOrder[b.card_rarity] - rarityOrder[a.card_rarity])
        break
      }
      default:
        result.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }

    return result
  }, [listings, search, rarityFilter, sortFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="h-6 w-6 text-chart-3" />
            Marketplace
          </h1>
          <p className="text-muted-foreground">
            Buy and sell cards to strengthen your club
          </p>
        </div>
        <Button
          className="bg-chart-3 text-white hover:bg-chart-3/90 hidden sm:flex"
          onClick={() => {}}
        >
          <Plus className="h-4 w-4 mr-2" />
          Sell Card
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <MarketFilters
            onSearchChange={setSearch}
            onRarityChange={setRarityFilter}
            onSortChange={setSortFilter}
            currentRarity={rarityFilter}
            currentSort={sortFilter}
          />

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Market Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Listings</span>
                <span className="font-medium text-foreground">{listings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filtered</span>
                <span className="font-medium text-foreground">{filteredListings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Balance</span>
                <span className="font-medium text-primary flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {balance.toLocaleString()} GC
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {filteredListings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Store className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No Listings Found</h3>
              <p className="text-sm text-muted-foreground">
                {search || rarityFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'The marketplace is empty. Be the first to list a card!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <MarketListingCard
                  key={listing.id}
                  listing={listing}
                  userId={userId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
