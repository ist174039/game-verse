import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import type { CoinTransaction } from '@/lib/types'

interface TransactionHistoryProps {
  transactions: CoinTransaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold text-foreground">Transaction History</h2>
        <p className="text-sm text-muted-foreground">Your recent GameCoin transactions</p>
      </div>

      <div className="divide-y divide-border">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase GameCoins or play matches to see your transaction history
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
                  <p className="font-medium text-foreground">
                    {getTransactionLabel(tx.source_type)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tx.description || getDefaultDescription(tx.source_type)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  tx.type === 'credit' ? 'text-accent' : 'text-destructive'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} GC
                </p>
                <p className="text-xs text-muted-foreground">
                  Balance: {tx.balance_after.toLocaleString()} GC
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tx.created_at)}
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
