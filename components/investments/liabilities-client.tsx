'use client'

import { TrendingDown, CreditCard, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface LiabilitiesClientProps {
  userId: string
}

const loans = [
  { id: 1, type: 'Card Loan', lender: 'GameVerse Bank', amount: 15000, remaining: 10000, monthlyPayment: 1200, dueDate: '2025-08-15', status: 'active', progress: 33 },
  { id: 2, type: 'Infrastructure Loan', lender: 'GameVerse Bank', amount: 10000, remaining: 8000, monthlyPayment: 800, dueDate: '2025-10-01', status: 'active', progress: 20 },
  { id: 3, type: 'Tournament Fee', lender: 'GameVerse League', amount: 5000, remaining: 5000, monthlyPayment: 500, dueDate: '2025-07-01', status: 'pending', progress: 0 },
]

const upcomingPayments = [
  { desc: 'Card Loan - Monthly', amount: 1200, dueDate: '2025-07-15' },
  { desc: 'Infrastructure Loan', amount: 800, dueDate: '2025-07-01' },
  { desc: 'Tournament Fee Installment', amount: 500, dueDate: '2025-07-01' },
]

export function LiabilitiesClient({ userId }: LiabilitiesClientProps) {
  const totalLiabilities = loans.reduce((s, l) => s + l.remaining, 0)
  const nextPayment = upcomingPayments[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-red-500" />
          Liabilities Dashboard
        </h1>
        <p className="text-muted-foreground">Manage your debts and payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-500">{totalLiabilities.toLocaleString()} GC</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active Loans</p>
          <p className="text-2xl font-bold text-foreground">{loans.filter(l => l.status === 'active').length}</p>
        </Card>
        <Card className="p-4 border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600">Next Payment</p>
          <p className="text-lg font-bold text-amber-600">{nextPayment.amount.toLocaleString()} GC</p>
          <p className="text-xs text-amber-500">Due {new Date(nextPayment.dueDate).toLocaleDateString()}</p>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-foreground">Active Loans</h2>
      <div className="space-y-3">
        {loans.map((loan) => (
          <Card key={loan.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{loan.type}</h3>
                  <Badge className={`text-[10px] border-0 text-white ${
                    loan.status === 'active' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}>{loan.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Lender: {loan.lender}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{loan.remaining.toLocaleString()} GC remaining of {loan.amount.toLocaleString()} GC</span>
                    <span>{loan.progress}% paid</span>
                  </div>
                  <Progress value={loan.progress} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>📅 Monthly: {loan.monthlyPayment} GC</span>
                  <span>⏰ Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">Pay Now</Button>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-bold text-foreground">Upcoming Payments</h2>
      <div className="space-y-2">
        {upcomingPayments.map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">{p.desc}</p>
                <p className="text-xs text-muted-foreground">Due {new Date(p.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-red-500">{p.amount.toLocaleString()} GC</span>
          </div>
        ))}
      </div>
    </div>
  )
}
