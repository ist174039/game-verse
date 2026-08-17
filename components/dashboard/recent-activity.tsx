import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import type { CoinTransaction } from '@/lib/types'

interface RecentActivityProps {
  transactions: CoinTransaction[]
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold text-foreground">Recent Activity</h2>
        <span className="text-sm text-muted-foreground">Last 5 transactions</span>
      </div>

      <div className="divide-y divide-border">
        {transactions.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start playing matches or purchase GameCoins to see activity here
            </p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${
                  tx.type === 'credit' 
                    ? 'bg-accent/10 text-accent' 
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {tx.type === 'credit' 
                    ? <ArrowDownLeft className="h-4 w-4" />
                    : <ArrowUpRight className="h-4 w-4" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {getTransactionLabel(tx.source_type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.description || getDefaultDescription(tx.source_type)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  tx.type === 'credit' ? 'text-accent' : 'text-destructive'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} GC
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(tx.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getTransactionLabel(sourceType: string): string {
  const labels: Record<string, string> = {
    match: 'Match Reward',
    tournament: 'Tournament Prize',
    reward: 'Achievement Reward',
    purchase: 'GameCoins Purchase',
    admin: 'Admin Adjustment',
    penalty: 'Penalty',
    market: 'Market Transaction',
    fee: 'Transaction Fee',
    infra_bonus: 'Infrastructure Bonus',
    passive_finance: 'Passive Income',
  }
  return labels[sourceType] || 'Transaction'
}

function getDefaultDescription(sourceType: string): string {
  const descriptions: Record<string, string> = {
    match: 'Earned from playing a match',
    tournament: 'Tournament winnings',
    reward: 'Achievement unlocked',
    purchase: 'Purchased via store',
    admin: 'Administrative adjustment',
    penalty: 'Penalty applied',
    market: 'Marketplace transaction',
    fee: 'Service fee',
    infra_bonus: 'Infrastructure bonus',
    passive_finance: 'Daily passive income',
  }
  return descriptions[sourceType] || ''
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
