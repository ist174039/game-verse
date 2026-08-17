'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Store, ShoppingCart, Tag, DollarSign, BarChart3, Users, Clock, Check, X, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface MarketClientProps {
  tournamentId: string
  tournamentName: string
  userId: string
}

export function MarketClient({ tournamentId, tournamentName, userId }: MarketClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('all')
  const [selectedPosition, setSelectedPosition] = useState('all')

  const escrowBalance = 12500
  const activeListings = 18

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Link href={`/tournaments/${tournamentId}`} className="hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs">{tournamentName}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="h-6 w-6 text-chart-4" />
            Tournament Market
          </h1>
          <p className="text-muted-foreground">Trade cards during the tournament</p>
        </div>
      </div>

      {/* Escrow Balance Bar */}
      <Card className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Escrow Balance</p>
              <p className="text-xl font-bold text-green-500">{escrowBalance.toLocaleString()} GC</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>{activeListings} active listings</span>
            </div>
            <Button variant="outline" size="sm">
              + Deposit
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="explore">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="explore"><Store className="mr-1 h-3 w-3" />Explorar</TabsTrigger>
          <TabsTrigger value="sell"><ShoppingCart className="mr-1 h-3 w-3" />Vender</TabsTrigger>
          <TabsTrigger value="offers"><Handshake className="mr-1 h-3 w-3" />Propostas</TabsTrigger>
          <TabsTrigger value="loans"><DollarSign className="mr-1 h-3 w-3" />Empréstimos</TabsTrigger>
        </TabsList>

        {/* Tab 1: Explore */}
        <TabsContent value="explore" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs"
            >
              <option value="all">All Rarities</option>
              <option value="legendary">Legendary</option>
              <option value="epic">Epic</option>
              <option value="rare">Rare</option>
              <option value="common">Common</option>
            </select>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs"
            >
              <option value="all">All Positions</option>
              <option value="gk">GK</option>
              <option value="def">DEF</option>
              <option value="mid">MID</option>
              <option value="fwd">FWD</option>
            </select>
            <Button variant="outline" size="sm" className="h-9">
              More Filters
            </Button>
          </div>

          {/* Listings */}
          <div className="space-y-2">
            {[
              { name: 'Lionel Messi', rating: 96, position: 'MD', rarity: 'legendary', price: 12000, seller: 'FC Dragon', timeLeft: '2h' },
              { name: 'Kylian Mbappé', rating: 95, position: 'AV', rarity: 'epic', price: 9800, seller: 'ThunderFC', timeLeft: '4h' },
              { name: 'Erling Haaland', rating: 94, position: 'AV', rarity: 'epic', price: 8500, seller: 'EagleFC', timeLeft: '6h' },
              { name: 'Kevin De Bruyne', rating: 93, position: 'MC', rarity: 'rare', price: 7200, seller: 'CarloFC', timeLeft: '1d' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm">
                    ⚽
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <Badge variant="outline" className="text-xs">{item.position}</Badge>
                      <Badge className={`text-[10px] border-0 ${
                        item.rarity === 'legendary' ? 'bg-amber-500' :
                        item.rarity === 'epic' ? 'bg-emerald-500' :
                        item.rarity === 'rare' ? 'bg-blue-500' : 'bg-gray-500'
                      } text-white`}>{item.rating}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seller: {item.seller} · {item.timeLeft} left
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{item.price.toLocaleString()} GC</span>
                  <Button size="sm">Buy</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Sell */}
        <TabsContent value="sell" className="space-y-4">
          <Card className="p-6 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">List a Card for Sale</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Select a card from your collection to list on the tournament market.
            </p>
            <Button>
              + Sell a Card
            </Button>
          </Card>
        </TabsContent>

        {/* Tab 3: Offers */}
        <TabsContent value="offers" className="space-y-4">
          <Card className="p-6 text-center">
            <Handshake className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">Pending Offers</h3>
            <p className="text-xs text-muted-foreground">No pending trade or loan offers.</p>
          </Card>
        </TabsContent>

        {/* Tab 4: Loans */}
        <TabsContent value="loans" className="space-y-4">
          <Card className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">Loan Market</h3>
            <p className="text-xs text-muted-foreground">
              Borrow cards from other players for a limited time.
            </p>
            <Button variant="outline" className="mt-4">
              Browse Loan Offers
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
