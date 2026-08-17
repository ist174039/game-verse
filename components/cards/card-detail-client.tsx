'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Zap, Shield, Sword, Star, ShoppingCart, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface CardDetailClientProps {
  cardId: string
  userId: string
}

export function CardDetailClient({ cardId, userId }: CardDetailClientProps) {
  // Toggle between Market view (state A) and Equipped view (state B)
  const [isMarketView, setIsMarketView] = useState(false)
  const [showPriceHistory, setShowPriceHistory] = useState(false)

  const cardData = {
    name: 'Cristiano Ronaldo',
    rarity: 'legendary' as const,
    rating: 98,
    position: 'AV',
    club: 'CarloFC',
    level: 3,
    maxLevel: 10,
    stats: {
      pace: 92,
      shooting: 97,
      passing: 88,
      dribbling: 94,
      defending: 45,
      physical: 85,
    },
    price: 9500,
    priceHistory: [9200, 9400, 9300, 9500, 9600, 9500],
  }

  const rarityColors: Record<string, string> = {
    legendary: 'from-amber-700 to-amber-500 border-amber-500',
    epic: 'from-emerald-700 to-emerald-500 border-emerald-500',
    rare: 'from-blue-700 to-blue-500 border-blue-500',
    common: 'from-gray-600 to-gray-400 border-gray-400',
  }

  const rarityLabel: Record<string, string> = {
    legendary: 'Lendário',
    epic: 'Épico',
    rare: 'Raro',
    common: 'Comum',
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Link href="/market" className="hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs">Back to Market</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{cardData.name}</h1>
        </div>
        <Button
          variant={isMarketView ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsMarketView(!isMarketView)}
        >
          {isMarketView ? 'My Card View' : 'Market View'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Visual */}
        <div className="space-y-4">
          <div
            className={`aspect-[3/4] rounded-xl bg-gradient-to-b ${rarityColors[cardData.rarity]} p-1`}
          >
            <div className="h-full w-full rounded-lg bg-gradient-to-b from-black/60 to-black/90 p-4 flex flex-col items-center justify-center text-white">
              <Badge className="mb-2 bg-white/20 text-white border-0 text-[10px]">
                {rarityLabel[cardData.rarity]}
              </Badge>
              <div className="text-5xl mb-2">⚡</div>
              <p className="text-lg font-bold">{cardData.name}</p>
              <p className="text-xs opacity-80">{cardData.position} · {cardData.club}</p>
              <div className="mt-3 flex items-center gap-1 text-2xl font-black">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                {cardData.rating}
              </div>
            </div>
          </div>

          {isMarketView && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Market Info</h3>
                <Badge variant="outline" className="text-xs">For Sale</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold text-foreground">{cardData.price} GC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller</span>
                  <span>FC Dragon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listed</span>
                  <span>2 days ago</span>
                </div>
                <Button className="w-full mt-2">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buy Now — {cardData.price} GC
                </Button>
              </div>

              {/* Price History */}
              <button
                onClick={() => setShowPriceHistory(!showPriceHistory)}
                className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <TrendingUp className="h-3 w-3" />
                Price History
              </button>
              {showPriceHistory && (
                <div className="mt-2 flex items-end gap-1 h-16">
                  {cardData.priceHistory.map((p, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t"
                      style={{ height: `${(p / Math.max(...cardData.priceHistory)) * 100}%` }}
                    >
                      <div className="text-[8px] text-center text-muted-foreground -mt-4">{p}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {!isMarketView && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-green-500 text-white border-0 text-[10px]">✓ Active</Badge>
                <span className="text-sm font-semibold text-foreground">Equipped</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Level {cardData.level}/{cardData.maxLevel}</span>
                    <span>{Math.round((cardData.level / cardData.maxLevel) * 100)}%</span>
                  </div>
                  <Progress value={(cardData.level / cardData.maxLevel) * 100} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Zap className="mr-1 h-3 w-3" /> Upgrade
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Upload className="mr-1 h-3 w-3" /> List
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-chart-2" />
              Player Stats
            </h3>
            <div className="space-y-3">
              {Object.entries(cardData.stats).map(([stat, value]) => (
                <div key={stat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground capitalize">{stat}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-chart-2"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {!isMarketView && (
            <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">💡 Upgrade Suggestion</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Level up to unlock +2 rating boost. Costs: 500 GC per level.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
