'use client'

import { useState } from 'react'
import { Globe, Search, Check, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface UniversosClientProps {
  userId: string
}

const myUniverses = [
  {
    name: 'Liga Portugal Virtual',
    icon: '🇵🇹',
    players: 128,
    ranking: 42,
    status: 'active',
    description: 'Competição virtual da Liga Portugal Betclic',
    tournaments: 3,
  },
  {
    name: 'GameVerse Global',
    icon: '🌍',
    players: 15000,
    ranking: 1890,
    status: 'active',
    description: 'The main GameVerse universe',
    tournaments: 24,
  },
]

const exploreUniverses = [
  {
    name: 'Champions Cup S4',
    icon: '🏆',
    players: 64,
    ranking: '-',
    status: 'upcoming',
    description: 'Elite tournament series — Season 4',
    tournaments: 1,
  },
  {
    name: 'Brasileirão Virtual',
    icon: '🇧🇷',
    players: 256,
    ranking: 15,
    status: 'open',
    description: 'Campeonato brasileiro de futebol virtual',
    tournaments: 2,
  },
  {
    name: 'Premier League Fantasy',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    players: 512,
    ranking: 88,
    status: 'active',
    description: 'EPL-inspired fantasy football universe',
    tournaments: 5,
  },
]

export function UniversosClient({ userId }: UniversosClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeUniverse, setActiveUniverse] = useState('Liga Portugal Virtual')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-chart-4" />
            Universos
          </h1>
          <p className="text-muted-foreground">Explore and manage your GameVerse universes</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Universe
        </Button>
      </div>

      {/* Active Universe Indicator */}
      <Card className="p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
              <Check className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Universe</p>
              <p className="text-sm font-bold text-foreground">{activeUniverse}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">Rank #42</Badge>
            <Badge className="bg-green-500 text-white border-0 text-[10px]">Active</Badge>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search universes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="mine">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="mine"><Globe className="mr-1 h-3 w-3" />Os Meus</TabsTrigger>
          <TabsTrigger value="explore"><Search className="mr-1 h-3 w-3" />Explorar</TabsTrigger>
          <TabsTrigger value="create"><Plus className="mr-1 h-3 w-3" />Criar</TabsTrigger>
        </TabsList>

        {/* Tab 1: My Universes */}
        <TabsContent value="mine" className="space-y-3">
          {myUniverses.map((universe) => (
            <Card key={universe.name} className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                    {universe.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{universe.name}</h3>
                      {activeUniverse === universe.name && (
                        <Badge className="bg-green-500 text-white border-0 text-[10px]">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{universe.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>👥 {universe.players.toLocaleString()} players</span>
                      <span>🏆 {universe.tournaments} tournaments</span>
                      <span>📊 Rank #{universe.ranking}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeUniverse !== universe.name && (
                    <Button size="sm" variant="outline">
                      <Check className="mr-1 h-3 w-3" /> Select
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Tab 2: Explore */}
        <TabsContent value="explore" className="space-y-3">
          {exploreUniverses.map((universe) => (
            <Card key={universe.name} className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                    {universe.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{universe.name}</h3>
                      <Badge className={`text-[10px] border-0 text-white ${
                        universe.status === 'active' ? 'bg-green-500' :
                        universe.status === 'open' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}>
                        {universe.status === 'active' ? 'Active' : universe.status === 'open' ? 'Open' : 'Upcoming'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{universe.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>👥 {universe.players.toLocaleString()} players</span>
                      <span>🏆 {universe.tournaments} tournaments</span>
                      {universe.ranking !== '-' && <span>📊 Rank #{universe.ranking}</span>}
                    </div>
                  </div>
                </div>
                <Button size="sm">
                  <Plus className="mr-1 h-3 w-3" /> Join
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Tab 3: Create */}
        <TabsContent value="create" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Create New Universe</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Universe Name</label>
                <Input placeholder="e.g. LaLiga Virtual" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary resize-none"
                  rows={3}
                  placeholder="Describe your universe..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Category</label>
                <select className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm">
                  <option>Regional League</option>
                  <option>Themed Cup</option>
                  <option>Fantasy League</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Universe
                </Button>
                <Button variant="outline" className="flex-1">Cancel</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
