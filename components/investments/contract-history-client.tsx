'use client'

import { useState } from 'react'
import { Clock, FileText, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface ContractHistoryClientProps {
  userId: string
}

const contractHistory = [
  {
    id: 1,
    club: 'FC Dragon',
    amount: 2500,
    roi: 12.5,
    startDate: '2025-01-15',
    endDate: '2025-07-15',
    status: 'active',
    totalReturned: 468.72,
  },
  {
    id: 2,
    club: 'Thunder United',
    amount: 1000,
    roi: 8.2,
    startDate: '2025-06-01',
    endDate: '2025-12-01',
    status: 'active',
    totalReturned: 13.67,
  },
  {
    id: 3,
    club: 'Phoenix Rising',
    amount: 3000,
    roi: 10.0,
    startDate: '2024-06-01',
    endDate: '2024-12-01',
    status: 'completed',
    totalReturned: 3300,
  },
  {
    id: 4,
    club: 'FC Dragon',
    amount: 1500,
    roi: 11.0,
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    status: 'completed',
    totalReturned: 1665,
  },
]

export function ContractHistoryClient({ userId }: ContractHistoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const filtered = contractHistory.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false
    if (searchQuery && !c.club.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-chart-4" />
          Contract History
        </h1>
        <p className="text-muted-foreground">View all your past and present investment contracts</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by club name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((contract) => (
          <Card key={contract.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{contract.club}</h3>
                    <Badge className={`text-[10px] border-0 text-white ${
                      contract.status === 'active' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {contract.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span>Amount: <strong className="text-foreground">{contract.amount.toLocaleString()} GC</strong></span>
                    <span>ROI: <strong className="text-green-500">{contract.roi}%</strong></span>
                    <span>Returned: <strong className="text-amber-500">{contract.totalReturned.toLocaleString()} GC</strong></span>
                    <span>{new Date(contract.startDate).toLocaleDateString()} → {new Date(contract.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
