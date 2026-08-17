'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, BarChart3, Handshake, DollarSign, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

interface InvestmentClientProps {
  userId: string
}

const clubs = [
  { name: 'FC Dragon', rank: 1, roi: 12.5, risk: 'medium', minInvestment: 500, raised: 75000, goal: 100000 },
  { name: 'Thunder United', rank: 3, roi: 8.2, risk: 'low', minInvestment: 300, raised: 120000, goal: 150000 },
  { name: 'Eagle FC', rank: 5, roi: 15.0, risk: 'high', minInvestment: 1000, raised: 40000, goal: 80000 },
  { name: 'CarloFC', rank: 2, roi: 10.0, risk: 'low', minInvestment: 200, raised: 50000, goal: 120000 },
]

const myInvestments = [
  { club: 'FC Dragon', amount: 2500, roi: 12.5, returnAmount: 312.5, status: 'active', monthsLeft: 3 },
  { club: 'Thunder United', amount: 1000, roi: 8.2, returnAmount: 82, status: 'active', monthsLeft: 5 },
]

export function InvestmentClient({ userId }: InvestmentClientProps) {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-investments'>('marketplace')
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [investAmount, setInvestAmount] = useState('')

  const totalInvested = myInvestments.reduce((s, i) => s + i.amount, 0)
  const totalMonthlyReturns = myInvestments.reduce((s, i) => s + i.returnAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-chart-4" />
            Investimentos
          </h1>
          <p className="text-muted-foreground">Invest in clubs and earn returns</p>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="text-2xl font-bold text-green-500">{totalInvested.toLocaleString()} GC</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Monthly Returns</p>
          <p className="text-2xl font-bold text-amber-500">+{totalMonthlyReturns.toFixed(1)} GC</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active Investments</p>
          <p className="text-2xl font-bold text-foreground">{myInvestments.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'marketplace'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Handshake className="inline h-4 w-4 mr-1" />
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('my-investments')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'my-investments'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="inline h-4 w-4 mr-1" />
          My Investments
        </button>
      </div>

      {activeTab === 'marketplace' && (
        <div className="space-y-3">
          {clubs.map((club) => (
            <Card key={club.name} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{club.name}</h3>
                    <Badge variant="outline" className="text-[10px]">Rank #{club.rank}</Badge>
                    <Badge className={`text-[10px] border-0 text-white ${
                      club.risk === 'low' ? 'bg-green-500' :
                      club.risk === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      {club.risk === 'low' ? 'Low Risk' : club.risk === 'medium' ? 'Med Risk' : 'High Risk'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>💰 Min {club.minInvestment} GC</span>
                    <span className="text-green-500">📈 {club.roi}% ROI</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{club.raised.toLocaleString()} GC raised</span>
                      <span>{Math.round((club.raised / club.goal) * 100)}% of {club.goal.toLocaleString()} GC</span>
                    </div>
                    <Progress value={(club.raised / club.goal) * 100} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {selectedClub === club.name ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-24 h-8 text-xs"
                      />
                      <Button size="sm" className="h-8">Invest</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedClub(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setSelectedClub(club.name)}>
                      <DollarSign className="mr-1 h-3 w-3" /> Invest
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'my-investments' && (
        <div className="space-y-3">
          {myInvestments.map((inv) => (
            <Card key={inv.club} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{inv.club}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Invested: <strong className="text-foreground">{inv.amount} GC</strong></span>
                    <span>ROI: <strong className="text-green-500">+{inv.roi}%</strong></span>
                    <span>Monthly: <strong className="text-amber-500">+{inv.returnAmount} GC</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-500 text-white border-0 text-[10px]">{inv.status}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{inv.monthsLeft}mo left</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
