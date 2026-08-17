'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface NewContractClientProps {
  userId: string
}

export function NewContractClient({ userId }: NewContractClientProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    clubName: '',
    investmentAmount: 1000,
    durationMonths: 6,
    expectedRoi: 10,
    contractType: 'fixed',
    autoRenew: false,
  })

  const handleSubmit = () => {
    router.push('/investimento')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <button onClick={() => router.back()} className="hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs">Back to Investments</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-chart-4" />
          New Investment Contract
        </h1>
        <p className="text-muted-foreground">Create a new investment contract with a club</p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <Label>Club / Entity</Label>
          <select
            value={form.clubName}
            onChange={(e) => setForm({ ...form, clubName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm"
          >
            <option value="">Select a club...</option>
            <option value="FC Dragon">FC Dragon</option>
            <option value="Thunder United">Thunder United</option>
            <option value="Eagle FC">Eagle FC</option>
            <option value="CarloFC">CarloFC</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Investment Amount (GC)</Label>
            <Input
              type="number"
              value={form.investmentAmount}
              onChange={(e) => setForm({ ...form, investmentAmount: Number(e.target.value) })}
              min={100}
            />
          </div>
          <div>
            <Label>Duration (months)</Label>
            <Input
              type="number"
              value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })}
              min={1}
              max={36}
            />
          </div>
        </div>

        <div>
          <Label>Expected ROI (%)</Label>
          <Input
            type="number"
            value={form.expectedRoi}
            onChange={(e) => setForm({ ...form, expectedRoi: Number(e.target.value) })}
            min={1}
            max={50}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Est. monthly return: <strong className="text-green-500">{((form.investmentAmount * form.expectedRoi) / 100 / form.durationMonths).toFixed(1)} GC</strong>
          </p>
        </div>

        <div>
          <Label>Contract Type</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {['fixed', 'variable', 'equity'].map((type) => (
              <button
                key={type}
                onClick={() => setForm({ ...form, contractType: type })}
                className={`rounded-lg border-2 p-3 text-left transition-all capitalize ${
                  form.contractType === type
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-border bg-card'
                }`}
              >
                <div className="text-sm font-medium text-foreground">{type}</div>
                <div className="text-xs text-muted-foreground">
                  {type === 'fixed' ? 'Guaranteed returns' : type === 'variable' ? 'Market-based returns' : 'Equity share'}
                </div>
                {form.contractType === type && <Badge className="mt-1 bg-green-500 text-white border-0 text-[10px]">✓</Badge>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium text-foreground">🔄 Auto-renew</p>
            <p className="text-xs text-muted-foreground">Automatically renew contract at maturity</p>
          </div>
          <button
            onClick={() => setForm({ ...form, autoRenew: !form.autoRenew })}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              form.autoRenew ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
            }`}
          >
            {form.autoRenew ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Contract Summary</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Club</p>
              <p className="font-bold">{form.clubName || 'Not selected'}</p>
            </div>
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="font-bold text-amber-400">{form.investmentAmount} GC</p>
            </div>
            <div>
              <p className="text-gray-400">Duration</p>
              <p className="font-bold">{form.durationMonths} months</p>
            </div>
            <div>
              <p className="text-gray-400">ROI</p>
              <p className="font-bold text-green-400">{form.expectedRoi}%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSubmit}>
            <Check className="mr-2 h-4 w-4" />
            Create Contract
          </Button>
        </div>
      </Card>
    </div>
  )
}
