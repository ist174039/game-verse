'use client'

import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary'
type SortFilter = 'newest' | 'cheapest' | 'most_expensive' | 'rarest'

interface MarketFiltersProps {
  onSearchChange: (value: string) => void
  onRarityChange: (value: RarityFilter) => void
  onSortChange: (value: SortFilter) => void
  currentRarity: RarityFilter
  currentSort: SortFilter
}

export function MarketFilters({
  onSearchChange,
  onRarityChange,
  onSortChange,
  currentRarity,
  currentSort,
}: MarketFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const rarities: { value: RarityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'common', label: 'Common' },
    { value: 'rare', label: 'Rare' },
    { value: 'epic', label: 'Epic' },
    { value: 'legendary', label: 'Legendary' },
  ]

  const sorts: { value: SortFilter; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'cheapest', label: 'Cheapest' },
    { value: 'most_expensive', label: 'Most Expensive' },
    { value: 'rarest', label: 'Rarest' },
  ]

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cards..."
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      {/* Filter Toggle */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-border"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
      </Button>

      {showFilters && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          {/* Rarity Filter */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Rarity</p>
            <div className="flex flex-wrap gap-2">
              {rarities.map((r) => (
                <Badge
                  key={r.value}
                  variant={currentRarity === r.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => onRarityChange(r.value)}
                >
                  {r.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Sort By</p>
            <div className="flex flex-wrap gap-2">
              {sorts.map((s) => (
                <Badge
                  key={s.value}
                  variant={currentSort === s.value ? 'secondary' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => onSortChange(s.value)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
