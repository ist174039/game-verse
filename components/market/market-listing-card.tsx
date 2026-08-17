'use client'

import { useState } from 'react'
import { Coins, User, Loader2, ShoppingCart, Star, Zap, Flame, Gem } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { MarketListingWithSeller } from '@/lib/types'

const rarityConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  common: {
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: <Star className="h-3 w-3" />,
    label: 'Common',
  },
  rare: {
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: <Zap className="h-3 w-3" />,
    label: 'Rare',
  },
  epic: {
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: <Flame className="h-3 w-3" />,
    label: 'Epic',
  },
  legendary: {
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    icon: <Gem className="h-3 w-3" />,
    label: 'Legendary',
  },
}

interface MarketListingCardProps {
  listing: MarketListingWithSeller
  userId: string
  canDelete?: boolean
}

export function MarketListingCard({ listing, userId, canDelete }: MarketListingCardProps) {
  const [isBuying, setIsBuying] = useState(false)
  const router = useRouter()
  const rarity = rarityConfig[listing.card_rarity] || rarityConfig.common

  const handleBuy = async () => {
    setIsBuying(true)
    const supabase = createClient()

    try {
      // Check balance
      const { data: wallet } = await supabase
        .from('wallet')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (!wallet || wallet.balance < listing.price) {
        alert('Insufficient balance!')
        setIsBuying(false)
        return
      }

      // Deduct balance and mark as sold
      const { error: buyError } = await supabase.rpc('buy_market_listing', {
        p_listing_id: listing.id,
        p_buyer_id: userId,
      })

      if (buyError) throw buyError
      router.refresh()
    } catch {
      alert('Failed to complete purchase. Please try again.')
    } finally {
      setIsBuying(false)
    }
  }

  const handleCancel = async () => {
    const supabase = createClient()
    await supabase
      .from('market_listing')
      .update({ status: 'cancelled' })
      .eq('id', listing.id)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/20 hover:shadow-sm">
      {/* Card Image Area */}
      <div className="aspect-[4/3] bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center p-4">
        <div className={`rounded-2xl p-4 ${rarity.color.replace('text-', 'bg-').replace('border-', '')}`}>
          {rarity.icon}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{listing.card_name}</h3>
            {listing.card_type && (
              <p className="text-xs text-muted-foreground">{listing.card_type}</p>
            )}
          </div>
          <Badge variant="outline" className={`${rarity.color} text-xs`}>
            <span className="flex items-center gap-1">
              {rarity.icon}
              {rarity.label}
            </span>
          </Badge>
        </div>

        {listing.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
        )}

        {/* Seller */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{listing.seller?.username || 'Unknown Seller'}</span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">{listing.price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">GC</span>
          </div>

          {listing.seller_id === userId || canDelete ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleBuy}
              disabled={isBuying}
            >
              {isBuying ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <ShoppingCart className="h-3 w-3 mr-1" />
              )}
              Buy
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
