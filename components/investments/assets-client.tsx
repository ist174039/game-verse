'use client'

import { TrendingUp, Wallet, Users, Home, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface AssetsClientProps {
  userId: string
}

const assetCategories = [
  { name: 'GameCoins', icon: '💰', value: 42500, change: '+2.5%', color: 'text-green-500' },
  { name: 'Card Collection', icon: '🃏', value: 96000, change: '+5.2%', color: 'text-green-500' },
  { name: 'Investments', icon: '📈', value: 15000, change: '+1.8%', color: 'text-green-500' },
  { name: 'Infrastructure', icon: '🏟️', value: 5000, change: '0%', color: 'text-muted-foreground' },
  { name: 'Escrow Balance', icon: '🔒', value: 12500, change: '-', color: 'text-muted-foreground' },
]

const assetCards = [
  { name: 'Cristiano Ronaldo', rarity: 'legendary', value: 15000, change: '+5%' },
  { name: 'Lionel Messi', rarity: 'legendary', value: 12000, change: '+3%' },
  { name: 'Kylian Mbappé', rarity: 'epic', value: 9800, change: '+8%' },
  { name: 'Erling Haaland', rarity: 'epic', value: 8500, change: '+4%' },
  { name: 'Kevin De Bruyne', rarity: 'rare', value: 7200, change: '-2%' },
]

export function AssetsClient({ userId }: AssetsClientProps) {
  const totalAssets = assetCategories.reduce((s, c) => s + c.value, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-6 w-6 text-green-500" />
          Assets Dashboard
        </h1>
        <p className="text-muted-foreground">Track all your GameVerse assets</p>
      </div>

      <Card className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
        <p className="text-xs text-muted-foreground">Total Assets Value</p>
        <p className="text-3xl font-black text-green-500">{totalAssets.toLocaleString()} GC</p>
      </Card>

      <div className="space-y-2">
        {assetCategories.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{cat.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.value.toLocaleString()} GC</p>
              </div>
            </div>
            <span className={`text-xs font-medium ${cat.color}`}>{cat.change}</span>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-foreground mt-6">Top Valued Cards</h2>
      <div className="space-y-2">
        {assetCards.map((card) => (
          <div key={card.name} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm">⚽</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{card.name}</span>
                  <Badge className={`text-[10px] border-0 text-white ${
                    card.rarity === 'legendary' ? 'bg-amber-500' : card.rarity === 'epic' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}>{card.rarity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{card.value.toLocaleString()} GC</p>
              </div>
            </div>
            <span className={`text-xs font-medium ${card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {card.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
