'use client'

import { useState } from 'react'
import { TrendingUp, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ContractReturnsClientProps {
  userId: string
}

const contracts = [
  {
    id: 1,
    club: 'FC Dragon',
    amount: 2500,
    roi: 12.5,
    totalReturn: 312.5,
    monthlyReturn: 52.08,
    status: 'active',
    monthsLeft: 3,
    totalMonths: 6,
    received: 468.72,
  },
  {
    id: 2,
    club: 'Thunder United',
    amount: 1000,
    roi: 8.2,
    totalReturn: 82,
    monthlyReturn: 13.67,
    status: 'active',
    monthsLeft: 5,
    totalMonths: 6,
    received: 13.67,
  },
]

export function ContractReturnsClient({ userId }: ContractReturnsClientProps) {
  const totalInvested = contracts.reduce((s, c) => s + c.amount, 0)
  const totalReceived = contracts.reduce((s, c) => s + c.received, 0)
  const totalProjected = contracts.reduce((s, c) => s + c.totalReturn, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-chart-4" />
          Contract Returns
        </h1>
        <p className="text-muted-foreground">Track returns on your investment contracts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="text-2xl font-bold text-foreground">{totalInvested.toLocaleString()} GC</p>
        </Card>
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <p className="text-xs text-green-600">Total Received</p>
          <p className="text-2xl font-bold text-green-500">+{totalReceived.toFixed(1)} GC</p>
        </Card>
        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <p className="text-xs text-amber-600">Projected Returns</p>
          <p className="text-2xl font-bold text-amber-500">{totalProjected.toFixed(1)} GC</p>
        </Card>
      </div>

      <div className="space-y-3">
        {contracts.map((contract) => (
          <Card key={contract.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{contract.club}</h3>
                  <Badge className="bg-green-500 text-white border-0 text-[10px]">Active</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>Investment: <strong className="text-foreground">{contract.amount} GC</strong></p>
                  <p>ROI: <strong className="text-green-500">{contract.roi}%</strong> · Monthly: <strong className="text-amber-500">+{contract.monthlyReturn.toFixed(2)} GC</strong></p>
                  <p>Received so far: <strong className="text-green-500">{contract.received.toFixed(2)} GC</strong></p>
                  <p>Projected total: <strong className="text-amber-500">{contract.totalReturn.toFixed(2)} GC</strong></p>
                  <p>Progress: Month {contract.totalMonths - contract.monthsLeft} of {contract.totalMonths}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-[10px]">{contract.monthsLeft}mo left</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Returns History</h3>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-3 w-3" /> Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Club</th>
                <th className="text-right pb-2">Amount</th>
                <th className="text-right pb-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: '2025-06-15', club: 'FC Dragon', amount: 52.08, type: 'Monthly Return' },
                { date: '2025-05-15', club: 'FC Dragon', amount: 52.08, type: 'Monthly Return' },
                { date: '2025-04-15', club: 'FC Dragon', amount: 52.08, type: 'Monthly Return' },
                { date: '2025-06-01', club: 'Thunder United', amount: 13.67, type: 'Monthly Return' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="py-2">{row.club}</td>
                  <td className="py-2 text-right text-green-500 font-medium">+{row.amount.toFixed(2)} GC</td>
                  <td className="py-2 text-right">{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
