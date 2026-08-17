'use client'

import Link from 'next/link'
import { TrendingUp, PiggyBank, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface PatrimonyClientProps {
  userId: string
}

export function PatrimonyClient({ userId }: PatrimonyClientProps) {
  const totalAssets = 158500
  const totalLiabilities = 35000
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-chart-4" />
            Patrimony Dashboard
          </h1>
          <p className="text-muted-foreground">Your complete financial overview</p>
        </div>
      </div>

      {/* Net Worth Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-900/20 to-green-900/20 border-blue-500/30">
        <p className="text-xs text-muted-foreground">Net Worth</p>
        <p className="text-3xl font-black text-foreground">{netWorth.toLocaleString()} GC</p>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="text-green-500">▲ Assets: {totalAssets.toLocaleString()} GC</span>
          <span className="text-red-500">▼ Liabilities: {totalLiabilities.toLocaleString()} GC</span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Assets
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/activos">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">GameCoins in Wallet</span>
              <span className="font-medium text-foreground">42,500 GC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card Collection Value</span>
              <span className="font-medium text-foreground">96,000 GC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Investments</span>
              <span className="font-medium text-foreground">15,000 GC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Infrastructure</span>
              <span className="font-medium text-foreground">5,000 GC</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Total Assets</span>
              <span className="text-green-500">{totalAssets.toLocaleString()} GC</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              Liabilities
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/passivos">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Loans</span>
              <span className="font-medium text-foreground">25,000 GC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Payments</span>
              <span className="font-medium text-foreground">10,000 GC</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Total Liabilities</span>
              <span className="text-red-500">{totalLiabilities.toLocaleString()} GC</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Net Worth Trend */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Net Worth Trend</h3>
        <div className="flex items-end gap-2 h-20">
          {[35000, 42000, 48000, 55000, 62000, 78000, 85000, 92000, 105000, 112000, 123500].map((val, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-chart-4/50 to-chart-4/20 rounded-t"
              style={{ height: `${(val / 150000) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
        </div>
      </Card>
    </div>
  )
}
