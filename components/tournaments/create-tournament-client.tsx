'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Trophy, Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface CreateTournamentClientProps {
  userId: string
  username: string
}

const formatOptions = [
  { id: 'knockout', icon: '⚡', label: 'Eliminatória Directa', desc: 'Perde = sai. Rápido e emocionante.' },
  { id: 'round_robin', icon: '📊', label: 'Round Robin', desc: 'Todos jogam contra todos.' },
  { id: 'groups', icon: '🏟️', label: 'Grupos + Knock-out', desc: 'Fase de grupos depois eliminatória.' },
  { id: 'league', icon: '📅', label: 'Campeonato', desc: 'Liga com jornadas e classificação.' },
]

const teamSizeOptions = [4, 8, 16, 32]

export function CreateTournamentClient({ userId, username }: CreateTournamentClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    description: '',
    format: 'knockout',
    teamSize: 8,
    entryFee: 200,
    // Step 3
    firstPrize: 60,
    secondPrize: 25,
    thirdPrize: 15,
    marketActive: true,
    // Step 4
    minDivision: 'all',
    universe: 'global',
    visibility: 'public',
    confirmationType: 'screenshot',
    antiDoping: true,
    lockSquad: false,
    disciplinaryEnabled: true,
    yellowRule: '3',
    redRule: '2',
    injuryMode: 'auto',
  })

  const totalSteps = 4

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const toggleSwitch = (key: string) => {
    setForm((prev) => ({ ...prev, [key]: !(prev as any)[key] }))
  }

  const poolTotal = form.entryFee * form.teamSize
  const platformFee = Math.round(poolTotal * 0.1)
  const prizePool = poolTotal - platformFee

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-chart-4" />
          Create Tournament
        </h1>
        <p className="text-muted-foreground">Set up your tournament in 4 steps</p>
      </div>

      {/* Step Progress */}
      <div className="flex gap-0 rounded-lg overflow-hidden border border-border">
        {['Básico', 'Formato', 'Economia', 'Regras'].map((label, i) => (
          <div
            key={label}
            className={`flex-1 py-2.5 text-center text-xs font-semibold ${
              i + 1 < step
                ? 'bg-green-500 text-white'
                : i + 1 === step
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {i + 1 < step ? '✓ ' : ''}{label}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Basic Information</h2>
            <div>
              <Label>Tournament Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Copa Inverno GameVerse"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your tournament..."
                className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={handleNext}>
                Next: Format <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Format */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Format & Structure</h2>

            <Label>Tournament Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setForm({ ...form, format: opt.id })}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    form.format === opt.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-border bg-card hover:border-muted-foreground'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.icon}</div>
                  <div className="text-sm font-bold text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                  {form.format === opt.id && (
                    <Badge className="mt-2 bg-green-500 text-white border-0">✓ Selected</Badge>
                  )}
                </button>
              ))}
            </div>

            <Label className="mt-2 block">Number of Teams</Label>
            <div className="flex gap-2 flex-wrap">
              {teamSizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => setForm({ ...form, teamSize: size })}
                  className={`rounded-lg border px-5 py-3 text-center transition-all ${
                    form.teamSize === size
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="text-lg font-bold text-foreground">{size}</div>
                  <div className="text-[10px] text-muted-foreground">teams</div>
                </button>
              ))}
              <button className="rounded-lg border border-dashed border-border px-4 py-3 text-center text-muted-foreground">
                <div className="text-lg">✎</div>
                <div className="text-[10px]">Custom</div>
              </button>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext}>
                Next: Economy <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Economy */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Economy & Prizes</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entry Fee (GC)</Label>
                <Input
                  type="number"
                  value={form.entryFee}
                  onChange={(e) => setForm({ ...form, entryFee: Number(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total pool ({form.teamSize} teams): <strong className="text-green-600">{poolTotal.toLocaleString()} GC</strong>
                </p>
              </div>
              <div>
                <Label>Platform Fee (auto)</Label>
                <Input value={`10% → ${platformFee} GC`} disabled className="mt-1 bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">
                  To distribute: <strong>{prizePool.toLocaleString()} GC</strong>
                </p>
              </div>
            </div>

            <Label>Prize Distribution</Label>
            <div className="space-y-2">
              {[
                { label: '1st Place', icon: '🥇', bg: 'bg-amber-500', value: form.firstPrize, key: 'firstPrize' },
                { label: '2nd Place', icon: '🥈', bg: 'bg-gray-400', value: form.secondPrize, key: 'secondPrize' },
                { label: '3rd Place', icon: '🥉', bg: 'bg-amber-800', value: form.thirdPrize, key: 'thirdPrize' },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.bg} text-sm flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <Input
                    type="number"
                    value={(form as any)[item.key]}
                    onChange={(e) => setForm({ ...form, [item.key]: Number(e.target.value) })}
                    className="flex-1"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm font-semibold text-green-600 min-w-[80px]">
                    = {Math.round(prizePool * (item.value / 100)).toLocaleString()} GC
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">🔀 Tournament Market</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Participants can trade cards during the tournament</p>
                </div>
                <button
                  onClick={() => toggleSwitch('marketActive')}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    form.marketActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                  }`}
                >
                  {form.marketActive ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext}>
                Next: Rules <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Rules */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Rules & Eligibility</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min. Division</Label>
                <select
                  value={form.minDivision}
                  onChange={(e) => setForm({ ...form, minDivision: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm"
                >
                  <option value="all">Open to all</option>
                  <option value="d5">Division 5+</option>
                  <option value="d4">Division 4+</option>
                  <option value="d3">Division 3+</option>
                  <option value="d2">Division 2+</option>
                  <option value="d1">Division 1 only</option>
                </select>
              </div>
              <div>
                <Label>Universe</Label>
                <select
                  value={form.universe}
                  onChange={(e) => setForm({ ...form, universe: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm"
                >
                  <option value="global">GameVerse Global</option>
                  <option value="portugal">Liga Portugal Virtual</option>
                  <option value="champions">Champions Cup S3</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Visibility</Label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="private">Private (invite code)</option>
                  <option value="semi">Semi-private (admin approval)</option>
                </select>
              </div>
              <div>
                <Label>Result Confirmation</Label>
                <select
                  value={form.confirmationType}
                  onChange={(e) => setForm({ ...form, confirmationType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm"
                >
                  <option value="screenshot">Screenshot required</option>
                  <option value="mutual">Mutual confirmation</option>
                  <option value="auto">Auto-confirm after 48h</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">🧪 Anti-doping (rating check)</p>
                  <p className="text-xs text-muted-foreground">Blocks abnormally high-rated cards</p>
                </div>
                <button
                  onClick={() => toggleSwitch('antiDoping')}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    form.antiDoping ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                  }`}
                >
                  {form.antiDoping ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">🔒 Lock squad after start</p>
                  <p className="text-xs text-muted-foreground">Prevent card substitutions after tournament starts</p>
                </div>
                <button
                  onClick={() => toggleSwitch('lockSquad')}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    form.lockSquad ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                  }`}
                >
                  {form.lockSquad ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Disciplinary Engine */}
              <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 p-3">
                <p className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-3">🟨 Disciplinary Engine</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Yellow Card Rule</Label>
                    <select
                      value={form.yellowRule}
                      onChange={(e) => setForm({ ...form, yellowRule: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs"
                    >
                      <option value="3">3 yellows = 1 match ban</option>
                      <option value="2">2 yellows = 1 match ban</option>
                      <option value="4">4 yellows = 1 match ban</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Red Card Rule</Label>
                    <select
                      value={form.redRule}
                      onChange={(e) => setForm({ ...form, redRule: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs"
                    >
                      <option value="2">Direct red = 2 match ban</option>
                      <option value="1">Direct red = 1 match ban</option>
                      <option value="manual">Manual by admin</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Tournament Summary</p>
              <p className="text-base font-bold">{form.name || 'Unnamed Tournament'}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatOptions.find((f) => f.id === form.format)?.label} · {form.teamSize} teams · Open to all · Global
              </p>
              <div className="flex gap-4 mt-2 text-xs">
                <div>
                  <p className="text-gray-400">Entry</p>
                  <p className="font-bold text-amber-400">{form.entryFee} GC</p>
                </div>
                <div>
                  <p className="text-gray-400">1st Prize</p>
                  <p className="font-bold text-amber-400">{Math.round(prizePool * (form.firstPrize / 100)).toLocaleString()} GC</p>
                </div>
                <div>
                  <p className="text-gray-400">Pool</p>
                  <p className="font-bold text-emerald-400">{prizePool.toLocaleString()} GC</p>
                </div>
                <div>
                  <p className="text-gray-400">Market</p>
                  <p className="font-bold text-green-400">{form.marketActive ? '✓ Active' : '✗ Inactive'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" /> Save Draft
                </Button>
                <Button onClick={handleComplete}>
                  <Trophy className="mr-2 h-4 w-4" /> Create Tournament
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Progress value={(step / totalSteps) * 100} className="h-1" />

      <div className="flex justify-center gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${i + 1 <= step ? 'bg-primary' : 'bg-secondary'}`}
          />
        ))}
      </div>
    </div>
  )

  function handleComplete() {
    router.push('/tournaments')
  }
}
