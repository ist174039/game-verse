'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ShieldAlert,
  Activity,
  History,
  Search,
  Save,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type TabId = 'current' | 'rules' | 'log' | 'audit'

interface PlayerDiscipline {
  name: string
  team: string
  yellows: number
  yellowThreshold: number
  reds: number
  injury: string | null
  injurySeverity?: 'light' | 'medium' | 'severe'
  availability: 'available' | 'suspended' | 'injured'
  counter: string
}

const DISCIPLINE_DATA: PlayerDiscipline[] = [
  {
    name: 'Carvalho',
    team: 'CarloFC',
    yellows: 2,
    yellowThreshold: 3,
    reds: 0,
    injury: null,
    availability: 'available',
    counter: 'Next yellow → suspended 1 match',
  },
  {
    name: 'Rodrigues',
    team: 'CarloFC',
    yellows: 0,
    yellowThreshold: 3,
    reds: 1,
    injury: null,
    availability: 'suspended',
    counter: 'Serving 1/2 matches',
  },
  {
    name: 'Nunes',
    team: 'CarloFC',
    yellows: 1,
    yellowThreshold: 3,
    reds: 0,
    injury: 'Medium',
    injurySeverity: 'medium',
    availability: 'injured',
    counter: 'Recovery: 0/2 matches',
  },
]

const LOG_ENTRIES = [
  { round: 1, opponent: 'FC Dragon', score: '2-1', cards: '1Y (Carvalho)', injuries: '—', date: '2025-01-10' },
  { round: 2, opponent: 'Mystic FC', score: '3-2', cards: '1R (Rodrigues)', injuries: 'Nunes (medium)', date: '2025-01-17' },
  { round: 3, opponent: 'StormFC', score: '1-1', cards: '1Y (Nunes)', injuries: '—', date: '2025-01-24' },
]

function getAvailabilityBadge(availability: PlayerDiscipline['availability']) {
  switch (availability) {
    case 'available':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Available</Badge>
    case 'suspended':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Suspended</Badge>
    case 'injured':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">Injured</Badge>
  }
}

function getInjuryBadge(injury: string | null) {
  if (!injury) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-400">
      {injury}
    </Badge>
  )
}

export function DisciplinaryClient() {
  const [activeTab, setActiveTab] = useState<TabId>('current')

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'current', label: 'Current Status', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'rules', label: 'Rules', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { id: 'log', label: 'Match Log', icon: <History className="h-3.5 w-3.5" /> },
    { id: 'audit', label: 'Audit', icon: <Search className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/team"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Disciplinary Panel</h1>
          <p className="text-sm text-muted-foreground">Copa Inverno GameVerse</p>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <CardContent className="p-4 sm:p-6">
          {/* ===== CURRENT STATUS TAB ===== */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              <div className="alert-info mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                <strong>Active engine:</strong> Yellow cards accumulated (3=1), straight red (2 games),
                injuries by severity (1/2/4 games). Auto-validation enabled on match start.
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Player</th>
                      <th className="pb-2 font-medium">Team</th>
                      <th className="pb-2 font-medium">Yellows</th>
                      <th className="pb-2 font-medium">Reds</th>
                      <th className="pb-2 font-medium">Injury</th>
                      <th className="pb-2 font-medium">Availability</th>
                      <th className="pb-2 font-medium">Counter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISCIPLINE_DATA.map((p) => (
                      <tr key={p.name} className="border-b last:border-0">
                        <td className="py-2 font-medium text-foreground">{p.name}</td>
                        <td className="py-2 text-muted-foreground">{p.team}</td>
                        <td className="py-2">
                          {p.reds > 0 || p.injury ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                              p.yellows >= p.yellowThreshold
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            )}>
                              {p.yellows}/{p.yellowThreshold}
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {p.reds > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {p.reds}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-2">{getInjuryBadge(p.injury)}</td>
                        <td className="py-2">{getAvailabilityBadge(p.availability)}</td>
                        <td className="py-2 text-xs text-muted-foreground">{p.counter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Rules
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          )}

          {/* ===== RULES TAB ===== */}
          {activeTab === 'rules' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-amber-800 dark:text-amber-400">
                  <ShieldAlert className="h-4 w-4" />
                  Card Rules
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Yellow cards per suspension</span>
                    <span className="font-bold text-foreground">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Suspension matches per red</span>
                    <span className="font-bold text-foreground">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Straight red (violent conduct)</span>
                    <span className="font-bold text-foreground">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Double yellow = red</span>
                    <span className="font-bold text-foreground">Yes</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-blue-800 dark:text-blue-400">
                  <AlertTriangle className="h-4 w-4" />
                  Injury Severity
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Light injury</span>
                    <span className="font-bold text-foreground">1 match</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Medium injury</span>
                    <span className="font-bold text-foreground">2 matches</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Severe injury</span>
                    <span className="font-bold text-foreground">4 matches</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Auto-recovery after count</span>
                    <span className="font-bold text-foreground">Yes</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20 md:col-span-2">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-green-800 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Auto-Update Flow (per validated match)
                </h3>
                <ol className="ml-5 list-decimal space-y-1 text-xs text-muted-foreground">
                  <li>Match result is validated by both players or admin</li>
                  <li>Disciplinary counters are incremented (yellows, reds, injuries)</li>
                  <li>Next match XI is revalidated — unavailable players auto-removed</li>
                  <li>Player returns to Available when counter reaches 0</li>
                  <li>Audit log records all changes with timestamp</li>
                </ol>
              </div>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Rules
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          )}

          {/* ===== MATCH LOG TAB ===== */}
          {activeTab === 'log' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Disciplinary events recorded per match round in the current competition.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Round</th>
                      <th className="pb-2 font-medium">Opponent</th>
                      <th className="pb-2 font-medium">Score</th>
                      <th className="pb-2 font-medium">Cards</th>
                      <th className="pb-2 font-medium">Injuries</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LOG_ENTRIES.map((entry) => (
                      <tr key={entry.round} className="border-b last:border-0">
                        <td className="py-2 font-medium text-foreground">{entry.round}</td>
                        <td className="py-2 text-muted-foreground">{entry.opponent}</td>
                        <td className="py-2 font-medium text-foreground">{entry.score}</td>
                        <td className="py-2">
                          {entry.cards !== '—' ? (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">{entry.cards}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2">
                          {entry.injuries !== '—' ? (
                            <Badge variant="outline" className="border-red-300 text-red-700">{entry.injuries}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{entry.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== AUDIT TAB ===== */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Full audit trail of all disciplinary changes. Every card, injury, and suspension is logged with timestamp and source.
              </div>
              <div className="rounded-lg border p-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Timestamp</th>
                      <th className="pb-2 font-medium">Player</th>
                      <th className="pb-2 font-medium">Event</th>
                      <th className="pb-2 font-medium">Source</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">2025-01-24 18:30</td>
                      <td className="py-2 font-medium text-foreground">Nunes</td>
                      <td className="py-2">Yellow card (1/3)</td>
                      <td className="py-2 text-muted-foreground">R3 vs StormFC</td>
                      <td className="py-2"><Badge className="bg-green-100 text-green-700">Auto</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">2025-01-17 19:00</td>
                      <td className="py-2 font-medium text-foreground">Rodrigues</td>
                      <td className="py-2">Straight red — suspended 2 games</td>
                      <td className="py-2 text-muted-foreground">R2 vs Mystic FC</td>
                      <td className="py-2"><Badge className="bg-green-100 text-green-700">Auto</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">2025-01-10 20:15</td>
                      <td className="py-2 font-medium text-foreground">Carvalho</td>
                      <td className="py-2">Yellow card (1/3)</td>
                      <td className="py-2 text-muted-foreground">R1 vs FC Dragon</td>
                      <td className="py-2"><Badge className="bg-green-100 text-green-700">Auto</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 text-muted-foreground">2025-01-10 20:15</td>
                      <td className="py-2 font-medium text-foreground">Carvalho</td>
                      <td className="py-2">Yellow card (2/3)</td>
                      <td className="py-2 text-muted-foreground">R1 vs FC Dragon (2nd half)</td>
                      <td className="py-2"><Badge className="bg-green-100 text-green-700">Auto</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
