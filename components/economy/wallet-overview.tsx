import { Coins, Sparkles, TrendingUp } from 'lucide-react'

interface WalletOverviewProps {
  balance: number
  infrastructureCredit: number
}

export function WalletOverview({ balance, infrastructureCredit }: WalletOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Main Balance */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/20 p-2">
            <Coins className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">{balance.toLocaleString()}</span>
          <span className="text-lg text-muted-foreground">GC</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          GameCoins for matches, upgrades, and more
        </p>
      </div>

      {/* Infrastructure Credit */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-accent/20 p-2">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Infrastructure Credit</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">{infrastructureCredit}</span>
          <span className="text-muted-foreground">credits</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Bonus credits for infrastructure upgrades
        </p>
      </div>

      {/* Earning Rate */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-chart-3/20 p-2">
            <TrendingUp className="h-5 w-5 text-chart-3" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Earning Rate</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">+0</span>
          <span className="text-muted-foreground">GC/day</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Upgrade Marketing to earn passive income
        </p>
      </div>
    </div>
  )
}
