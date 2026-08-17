'use client'

import { useState } from 'react'
import {
  Gavel,
  Coins,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  Search,
  Plus,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// --- Types ---
interface AuctionItem {
  id: string
  playerName: string
  position: string
  rating: number
  rarity: string
  seller: string
  startBid: number
  minIncrement: number
  currentBid: number
  highestBidder: string | null
  timer: string
  isHot: boolean
  isMyBid: boolean
  myMaxBid?: number
  bids: { bidder: string; amount: number; time: string; isMe?: boolean }[]
}

interface AuctionPageClientProps {
  balance: number
  escrowAmount: number
}

const mockActiveAuctions: AuctionItem[] = [
  {
    id: '1',
    playerName: "Ronaldo '23",
    position: 'AV',
    rating: 98,
    rarity: 'LEND',
    seller: 'Phoenix Utd',
    startBid: 8000,
    minIncrement: 500,
    currentBid: 11500,
    highestBidder: 'ThunderFC',
    timer: '0h 48m 22s',
    isHot: true,
    isMyBid: true,
    myMaxBid: 14000,
    bids: [
      { bidder: 'ThunderFC', amount: 11500, time: '5min' },
      { bidder: 'FC Dragon', amount: 11000, time: '12min' },
      { bidder: 'CarloFC', amount: 10500, time: '20min', isMe: true },
    ],
  },
  {
    id: '2',
    playerName: 'Van Dijk',
    position: 'DEF',
    rating: 90,
    rarity: 'ÉPIC',
    seller: 'Dark Knights',
    startBid: 2500,
    minIncrement: 100,
    currentBid: 2800,
    highestBidder: 'Red Eagles',
    timer: '5h 30m restantes',
    isHot: false,
    isMyBid: false,
    bids: [],
  },
  {
    id: '3',
    playerName: 'Messi',
    position: 'AV',
    rating: 97,
    rarity: 'LEND',
    seller: 'FC Dragon',
    startBid: 10000,
    minIncrement: 500,
    currentBid: 12500,
    highestBidder: 'BlueStars',
    timer: '1d 3h restantes',
    isHot: false,
    isMyBid: false,
    bids: [],
  },
  {
    id: '4',
    playerName: "Mbappé '24",
    position: 'AV',
    rating: 95,
    rarity: 'ÉPIC',
    seller: 'Red Eagles',
    startBid: 7000,
    minIncrement: 500,
    currentBid: 8500,
    highestBidder: null,
    timer: '12h restantes',
    isHot: false,
    isMyBid: false,
    bids: [],
  },
]

const mockMyBids: AuctionItem[] = [
  {
    id: '1',
    playerName: "Ronaldo '23",
    position: 'AV',
    rating: 98,
    rarity: 'LEND',
    seller: 'Phoenix Utd',
    startBid: 8000,
    minIncrement: 500,
    currentBid: 11500,
    highestBidder: 'ThunderFC',
    timer: '0h 48m 22s',
    isHot: true,
    isMyBid: true,
    myMaxBid: 14000,
    bids: [],
  },
  {
    id: '5',
    playerName: 'Kante',
    position: 'MED',
    rating: 87,
    rarity: 'RARE',
    seller: 'BlueStars',
    startBid: 1500,
    minIncrement: 100,
    currentBid: 2100,
    highestBidder: 'CarloFC',
    timer: '2h 15m restantes',
    isHot: false,
    isMyBid: true,
    myMaxBid: 3000,
    bids: [],
  },
]

export function AuctionPageClient({ balance, escrowAmount }: AuctionPageClientProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'mybids' | 'create' | 'history'>('active')
  const [bidAmounts, setBidAmounts] = useState<Record<string, number>>({})
  const [autoBid, setAutoBid] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const totalBalance = balance + escrowAmount
  const activeAuctions = mockActiveAuctions.filter(a =>
    a.playerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBid = (auctionId: string, currentBid: number, minIncrement: number) => {
    const amount = bidAmounts[auctionId] || currentBid + minIncrement
    if (amount > balance) return
    console.log(`Licitar ${amount} GC no leilão ${auctionId}`)
  }

  const setAutoBidForAuction = (auctionId: string, amount: number) => {
    if (amount > balance) return
    setAutoBid(prev => ({ ...prev, [auctionId]: amount }))
    console.log(`Auto-bid definido para ${amount} GC no leilão ${auctionId}`)
  }

  // Helper to get rarity colors
  const getRarityGradient = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'lend': return 'from-amber-950 to-amber-900 border-amber-500'
      case 'épic': return 'from-emerald-950 to-emerald-900 border-emerald-500'
      case 'rare': return 'from-blue-950 to-blue-900 border-blue-500'
      default: return 'from-gray-800 to-gray-700 border-gray-500'
    }
  }

  const getRarityTextColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'lend': return 'text-amber-300'
      case 'épic': return 'text-emerald-300'
      case 'rare': return 'text-blue-300'
      default: return 'text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" />
          Casa de Leilões
        </h1>
        <p className="text-muted-foreground mt-1">
          Sistema de licitação em tempo real — GC em escrow automático
        </p>
      </div>

      {/* Escrow Alert */}
      {escrowAmount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <strong>🔒 Escrow activo:</strong> Tens <strong>{escrowAmount.toLocaleString()} GC</strong> retidos em escrow ({mockMyBids.length} leilões). Devolução automática se superado ou leilão cancelado.
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-xs text-muted-foreground">Saldo disponível</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {balance.toLocaleString()} GC
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-950">
          <div className="text-xs text-muted-foreground">🔒 Em escrow</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {escrowAmount.toLocaleString()} GC
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-xs text-muted-foreground">Saldo total</div>
          <div className="text-lg font-bold text-primary">
            {totalBalance.toLocaleString()} GC
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1">
        {([
          { key: 'active', label: `Activos (${activeAuctions.length})` },
          { key: 'mybids', label: `Meus Lances (${mockMyBids.length})` },
          { key: 'create', label: 'Colocar em Leilão' },
          { key: 'history', label: 'Histórico' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar jogador em leilão..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Auction Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {activeAuctions.map(auction => (
              <div
                key={auction.id}
                className={cn(
                  'relative rounded-xl border p-4 transition-all',
                  auction.isHot
                    ? 'border-amber-400 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-950/30'
                    : 'border-border bg-card'
                )}
              >
                {auction.isHot && (
                  <div className="absolute -top-2.5 left-3 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    🔥 A TERMINAR!
                  </div>
                )}

                <div className="flex gap-3">
                  {/* Player Mini Card */}
                  <div className={cn(
                    'flex min-w-[76px] flex-col items-center rounded-xl bg-gradient-to-b p-3 text-white',
                    getRarityGradient(auction.rarity)
                  )}>
                    <div className="text-xl">{auction.position === 'AV' ? '⚡' : auction.position === 'DEF' ? '🛡️' : auction.position === 'MED' ? '⚙️' : '🧤'}</div>
                    <div className="mt-1 text-[10px] font-bold leading-tight text-center">{auction.playerName}</div>
                    <div className={cn('mt-0.5 text-[9px]', getRarityTextColor(auction.rarity))}>
                      {auction.position} · {auction.rating} · {auction.rarity}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Vendedor: <strong className="text-foreground">{auction.seller}</strong>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Início: {auction.startBid.toLocaleString()} GC · +{auction.minIncrement} GC mín.
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] text-muted-foreground">Lance actual:</div>
                      <div className={cn(
                        'text-2xl font-extrabold leading-tight',
                        auction.isHot ? 'text-amber-500' : 'text-foreground'
                      )}>
                        {auction.currentBid.toLocaleString()} GC
                      </div>
                      <div className="text-[10px] mt-0.5 text-muted-foreground">
                        por <strong>{auction.highestBidder || '—'}</strong>
                        {auction.isMyBid && <span className="ml-1 text-amber-500">(O teu lance)</span>}
                      </div>
                    </div>

                    {/* Timer */}
                    <div className={cn(
                      'mt-2 rounded-md px-2 py-1 text-center text-xs font-bold',
                      auction.isHot ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' : 'bg-secondary text-muted-foreground'
                    )}>
                      ⏱️ {auction.timer}
                    </div>

                    {/* Bid History */}
                    {auction.bids.length > 0 && (
                      <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                        {auction.bids.slice(-3).map((bid, i) => (
                          <div key={i} className={cn(
                            'flex justify-between',
                            bid.isMe && 'font-medium text-amber-600 dark:text-amber-400'
                          )}>
                            <span>{bid.bidder} → {bid.amount.toLocaleString()} GC</span>
                            <span>{bid.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bid Input */}
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <Coins className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder={`${(auction.currentBid + auction.minIncrement).toLocaleString()} GC`}
                      className="pl-7 text-sm"
                      value={bidAmounts[auction.id] || ''}
                      onChange={e => setBidAmounts(prev => ({ ...prev, [auction.id]: Number(e.target.value) }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleBid(auction.id, auction.currentBid, auction.minIncrement)}
                    disabled={(bidAmounts[auction.id] || 0) > balance}
                  >
                    Licitar
                  </Button>
                </div>

                {/* Auto-bid */}
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      const max = prompt('Lance auto-máx (GC):', String(autoBid[auction.id] || auction.currentBid + auction.minIncrement))
                      if (max) setAutoBidForAuction(auction.id, Number(max))
                    }}
                  >
                    🤖 Lance auto-máx: {autoBid[auction.id] ? `${autoBid[auction.id].toLocaleString()} GC` : 'Off'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mybids' && (
        <div className="space-y-3">
          {mockMyBids.map(auction => (
            <div key={auction.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-b text-white text-xs font-bold',
                    getRarityGradient(auction.rarity)
                  )}>
                    {auction.playerName.split(' ')[0]}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{auction.playerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {auction.position} · {auction.rating} · {auction.rarity} — {auction.seller}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{auction.currentBid.toLocaleString()} GC</div>
                  <div className="text-xs text-muted-foreground">Teu lance máximo: {auction.myMaxBid?.toLocaleString()} GC</div>
                </div>
              </div>
              {auction.isHot && (
                <div className="mt-2 text-xs text-red-500 font-medium">🔥 Estás a ser superado!</div>
              )}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setActiveTab('active')}>
                  🔄 Aumentar Lance
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  🤖 Auto-bid: {auction.myMaxBid?.toLocaleString()} GC
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="rounded-lg border border-dashed border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">📤 Colocar Carta em Leilão</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Carta a leiloar</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>Seleccionar do elenco…</option>
                <option>Messi &apos;22 (AV · 97)</option>
                <option>Kante (MED · 87)</option>
                <option>Neuer (GR · 90)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Lance inicial (GC)</label>
              <Input type="number" placeholder="ex: 1,000 GC" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Incremento mínimo</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>+50 GC</option>
                <option>+100 GC</option>
                <option>+250 GC</option>
                <option>+500 GC</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Duração</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>1h</option>
                <option>6h</option>
                <option>12h</option>
                <option>24h</option>
                <option>48h</option>
                <option>72h</option>
                <option>7 dias</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button className="gap-2">
              <Gavel className="h-4 w-4" />
              Iniciar Leilão
            </Button>
            <Button variant="outline">Ver Todos os Leilões Activos</Button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Histórico de leilões concluídos aparecerá aqui.</p>
          <p className="text-sm mt-1">Leilões finalizados nos últimos 30 dias.</p>
        </div>
      )}

      {/* Escrow Lifecycle Info */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <strong>📋 Ciclo de vida do escrow:</strong> Ao licitar, os GC são movidos para{' '}
        <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">auction_escrow</code> (status{' '}
        <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">held</code>). Se superado, o escrow é libertado
        e os GC voltam à wallet automaticamente. Se o leilão termina e és o vencedor, o escrow é liquidado e a carta
        é transferida. Se o leilão for cancelado pelo vendedor, todos os escrows são libertados.
      </div>
    </div>
  )
}
