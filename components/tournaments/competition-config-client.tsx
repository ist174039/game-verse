'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Copy,
  Settings,
  Trophy,
  Swords,
  Gamepad2,
  Globe,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type CompetitionTab = 'league' | 'tournaments' | 'casual' | 'global'

interface ConfigRow {
  label: string
  description: string
  value: string | boolean
  valueType: 'badge' | 'toggle'
  badgeColor?: string
}

const MATCH_RULES: ConfigRow[] = [
  { label: 'Match Duration', description: 'Real match time (minutes)', value: '90 min', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
  { label: 'Substitutions', description: 'Max per match', value: '5', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
  { label: 'Extra Time / Penalties', description: 'Knockout stages only', value: true, valueType: 'toggle' },
  { label: 'Offside Rule', description: 'Rule active', value: true, valueType: 'toggle' },
  { label: 'Accumulated Cards', description: 'Suspension after N cards', value: '3 yellows', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
  { label: 'Min Interval Between Matches', description: 'For the same club', value: '4h', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
]

const ECONOMY_REWARDS: ConfigRow[] = [
  { label: 'Win Prize', description: 'GameCoins awarded', value: '+50 GC', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
  { label: 'Participation Prize', description: 'Just for playing', value: '+10 GC', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
  { label: 'Entry Fee', description: 'Cost to participate', value: '0 GC', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
  { label: 'Ranking Bonus', description: 'Extra GC by final position', value: true, valueType: 'toggle' },
  { label: 'Season Rewards', description: 'End of season bonus', value: true, valueType: 'toggle' },
  { label: 'Desertion Penalty', description: 'GC lost when abandoning', value: '-25 GC', valueType: 'badge', badgeColor: 'bg-amber-500 text-white' },
]

const FEATURES_MODULES: ConfigRow[] = [
  { label: 'Card Market', description: 'Buy/sell between players', value: true, valueType: 'toggle' },
  { label: 'Player Auction', description: 'Bidding system', value: true, valueType: 'toggle' },
  { label: 'Infrastructure Cards', description: 'Stadium, Academy, etc.', value: true, valueType: 'toggle' },
  { label: 'Injury System', description: 'Players can get injured', value: false, valueType: 'toggle' },
  { label: 'Discipline (Cards)', description: 'Accumulation & suspensions', value: true, valueType: 'toggle' },
  { label: 'Advanced Stats', description: 'Post-match charts & reports', value: true, valueType: 'toggle' },
  { label: 'Push Notifications', description: 'Match & event alerts', value: true, valueType: 'toggle' },
  { label: 'Replay / Match History', description: 'Match history', value: true, valueType: 'toggle' },
]

const PRESETS = [
  {
    id: 'competitive',
    name: '🏆 Competitive',
    active: true,
    items: [
      '✅ Market · Auction · Infrastructure',
      '✅ Injuries · Discipline · Stats',
      '✅ Notifications · Replay · Season bonus',
      '⏱️ 90 min · 5 subs · Offside ON',
    ],
    tags: ['League & Tournaments'],
  },
  {
    id: 'casual',
    name: '⚽ Casual',
    active: false,
    items: [
      '✅ Market · Notifications · Replay',
      '❌ Auction · Infrastructure',
      '❌ Injuries · Discipline · Season bonus',
      '⏱️ 60 min · 3 subs · Offside OFF',
    ],
    tags: ['Quick matches'],
  },
  {
    id: 'lightning',
    name: '🏟️ Lightning Tournament',
    active: false,
    items: [
      '✅ Market · Stats · Notifications',
      '✅ Injuries · Discipline',
      '❌ Auction · Infrastructure · Season bonus',
      '⏱️ 45 min · 3 subs · Extra Time ON',
    ],
    tags: ['Express tournaments'],
  },
]

function ConfigRowItem({ row }: { row: ConfigRow }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{row.label}</p>
        <p className="text-xs text-muted-foreground">{row.description}</p>
      </div>
      {row.valueType === 'badge' ? (
        <Badge className={cn('text-xs font-bold', row.badgeColor || '')}>
          {row.value as string}
        </Badge>
      ) : (
        <span className={row.value ? 'text-green-500' : 'text-red-400'}>
          {row.value ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        </span>
      )}
    </div>
  )
}

export function CompetitionConfigClient() {
  const [activeTab, setActiveTab] = useState<CompetitionTab>('league')

  const tabs: { id: CompetitionTab; label: string; icon: React.ReactNode }[] = [
    { id: 'league', label: '🏆 Global League', icon: null },
    { id: 'tournaments', label: '🏟️ Tournaments', icon: null },
    { id: 'casual', label: '⚽ Casual', icon: null },
    { id: 'global', label: '🔧 Global Rules', icon: null },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/tournaments"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Competition Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Enable/disable components and features per competition type
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">18</p>
            <p className="text-xs text-muted-foreground">Total Components</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">12</p>
            <p className="text-xs text-muted-foreground">Active League</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">10</p>
            <p className="text-xs text-muted-foreground">Active Tournaments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">6</p>
            <p className="text-xs text-muted-foreground">Active Casual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">3</p>
            <p className="text-xs text-muted-foreground">Custom Rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Config Panel */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-sm">
              ⚙️
            </div>
            <h2 className="text-sm font-bold text-emerald-500">Component Management by Competition</h2>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-amber-500 text-white">Season 2026</Badge>
            <Badge variant="secondary">3 competitions</Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CardContent className="space-y-8 p-6">
          {/* Match Rules */}
          <section>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              📋 Match Rules
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {MATCH_RULES.map((row) => (
                <ConfigRowItem key={row.label} row={row} />
              ))}
            </div>
          </section>

          {/* Economy & Rewards */}
          <section>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              💰 Economy & Rewards
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {ECONOMY_REWARDS.map((row) => (
                <ConfigRowItem key={row.label} row={row} />
              ))}
            </div>
          </section>

          {/* Features & Modules */}
          <section>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              🧩 Features & Modules
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {FEATURES_MODULES.map((row) => (
                <ConfigRowItem key={row.label} row={row} />
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Configuration
              </Button>
              <Button variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset Defaults
              </Button>
              <Button variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                Copy to Tournaments
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              Last change: 04 Jun 2026 &middot; by admin
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Presets Panel */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-sm font-bold text-foreground">📦 Configuration Presets</h2>
          <Badge className="bg-amber-500 text-white">Templates</Badge>
        </div>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  'cursor-pointer rounded-xl border-2 p-4 transition-colors',
                  preset.active
                    ? 'border-amber-500 bg-card'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{preset.name}</span>
                  {preset.active && (
                    <Badge className="bg-amber-500 text-white text-[10px]">Active</Badge>
                  )}
                </div>
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  {preset.items.map((item, i) => (
                    <p key={i}>{item}</p>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  {preset.tags.join(' · ')}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            💡 Click a preset to automatically apply its configuration to the selected competition
          </p>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-sm font-bold text-foreground">📜 Change History</h2>
          <Badge className="bg-amber-500 text-white">Audit Trail</Badge>
        </div>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Component</th>
                  <th className="pb-2 font-medium">Old Value</th>
                  <th className="pb-2 font-medium">New Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">04 Jun 14:32</td>
                  <td className="py-2 font-medium text-foreground">admin</td>
                  <td className="py-2">Toggle</td>
                  <td className="py-2">Player Auction</td>
                  <td className="py-2 text-muted-foreground">OFF</td>
                  <td className="py-2"><Badge className="bg-green-100 text-green-700 text-[10px]">ON</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">03 Jun 09:15</td>
                  <td className="py-2 font-medium text-foreground">admin</td>
                  <td className="py-2">Change</td>
                  <td className="py-2">Match Duration</td>
                  <td className="py-2">90 min</td>
                  <td className="py-2"><Badge className="bg-amber-100 text-amber-700 text-[10px]">90 min</Badge></td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">02 Jun 18:00</td>
                  <td className="py-2 font-medium text-foreground">superadmin</td>
                  <td className="py-2">Preset Applied</td>
                  <td className="py-2">Full Configuration</td>
                  <td className="py-2 text-muted-foreground">—</td>
                  <td className="py-2"><Badge className="bg-blue-100 text-blue-700 text-[10px]">Competitive</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
