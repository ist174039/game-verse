'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Users,
  BarChart3,
  History,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2'] as const

interface Player {
  id: string
  name: string
  position: string
  positionAbbr: string
  rating: number
  isStar?: boolean
  isInjured?: boolean
  isSuspended?: boolean
  yellowCards?: number
  maxYellowCards?: number
  redCardSuspension?: string
}

const MOCK_STARTING_XI: Player[] = [
  { id: '1', name: 'Mendes', position: 'Goalkeeper', positionAbbr: 'GR', rating: 88 },
  { id: '2', name: 'Sousa', position: 'Left Back', positionAbbr: 'LC', rating: 81 },
  { id: '3', name: 'Carvalho', position: 'Center Back', positionAbbr: 'DC', rating: 83 },
  { id: '4', name: 'Pereira', position: 'Center Back', positionAbbr: 'DC', rating: 82 },
  { id: '5', name: 'Silva', position: 'Right Back', positionAbbr: 'RC', rating: 84 },
  { id: '6', name: 'Costa', position: 'Midfielder', positionAbbr: 'MC', rating: 86 },
  { id: '7', name: 'Gomes', position: 'Midfielder', positionAbbr: 'MC', rating: 85 },
  { id: '8', name: 'Alves', position: 'Midfielder', positionAbbr: 'MC', rating: 83 },
  { id: '9', name: 'Nunes', position: 'Winger', positionAbbr: 'EX', rating: 87 },
  { id: '10', name: 'Rodrigues', position: 'Striker', positionAbbr: 'CA', rating: 93, isStar: true },
  { id: '11', name: 'Ferreira', position: 'Winger', positionAbbr: 'EX', rating: 86 },
]

const MOCK_SUBSTITUTES: Player[] = [
  { id: '12', name: 'Santos', position: 'Goalkeeper', positionAbbr: 'GR', rating: 74 },
  { id: '13', name: 'Oliveira', position: 'Center Back', positionAbbr: 'DC', rating: 78 },
  { id: '14', name: 'Vieira', position: 'Midfielder', positionAbbr: 'MC', rating: 77 },
  { id: '15', name: 'Lopes', position: 'Midfielder', positionAbbr: 'MC', rating: 75 },
  { id: '16', name: 'Monteiro', position: 'Forward', positionAbbr: 'AV', rating: 79 },
]

const MOCK_UNAVAILABLE: Player[] = [
  { id: '3', name: 'Carvalho', position: 'Center Back', positionAbbr: 'DC', rating: 83, yellowCards: 2, maxYellowCards: 3 },
  { id: '10', name: 'Rodrigues', position: 'Striker', positionAbbr: 'CA', rating: 93, isStar: true, redCardSuspension: '1/2' },
  { id: '9', name: 'Nunes', position: 'Winger', positionAbbr: 'EX', rating: 87, isInjured: true },
]

interface PitchPosition {
  style: React.CSSProperties
  player: Player | null
  formation: string
  index: number
}

function getPitchPositions(formation: string): { top: string; left: string }[] {
  const positions: { top: string; left: string }[] = []
  
  // GK - always at bottom center
  positions.push({ top: '82%', left: '50%' })
  
  switch (formation) {
    case '4-3-3':
      // Defenders
      positions.push({ top: '65%', left: '8%' })   // LB
      positions.push({ top: '65%', left: '32%' })  // CB
      positions.push({ top: '65%', left: '68%' })  // CB
      positions.push({ top: '65%', left: '92%' })  // RB
      // Midfielders
      positions.push({ top: '45%', left: '15%' })  // CM
      positions.push({ top: '40%', left: '50%' })  // CM
      positions.push({ top: '45%', left: '85%' })  // CM
      // Forwards
      positions.push({ top: '15%', left: '12%' })  // LW
      positions.push({ top: '8%', left: '50%' })   // ST
      positions.push({ top: '15%', left: '88%' })  // RW
      break
    case '4-4-2':
      positions.push({ top: '65%', left: '8%' })
      positions.push({ top: '65%', left: '32%' })
      positions.push({ top: '65%', left: '68%' })
      positions.push({ top: '65%', left: '92%' })
      positions.push({ top: '42%', left: '15%' })
      positions.push({ top: '42%', left: '40%' })
      positions.push({ top: '42%', left: '60%' })
      positions.push({ top: '42%', left: '85%' })
      positions.push({ top: '15%', left: '30%' })
      positions.push({ top: '15%', left: '70%' })
      break
    case '4-2-3-1':
      positions.push({ top: '65%', left: '8%' })
      positions.push({ top: '65%', left: '32%' })
      positions.push({ top: '65%', left: '68%' })
      positions.push({ top: '65%', left: '92%' })
      positions.push({ top: '48%', left: '25%' }) // CDM
      positions.push({ top: '48%', left: '75%' }) // CDM
      positions.push({ top: '30%', left: '10%' })  // LW
      positions.push({ top: '28%', left: '50%' })  // CAM
      positions.push({ top: '30%', left: '90%' })  // RW
      positions.push({ top: '12%', left: '50%' })  // ST
      break
    case '3-5-2':
      positions.push({ top: '65%', left: '20%' })
      positions.push({ top: '65%', left: '50%' })
      positions.push({ top: '65%', left: '80%' })
      positions.push({ top: '48%', left: '5%' })
      positions.push({ top: '42%', left: '25%' })
      positions.push({ top: '40%', left: '50%' })
      positions.push({ top: '42%', left: '75%' })
      positions.push({ top: '48%', left: '95%' })
      positions.push({ top: '15%', left: '30%' })
      positions.push({ top: '15%', left: '70%' })
      break
    case '5-3-2':
      positions.push({ top: '72%', left: '15%' })
      positions.push({ top: '68%', left: '35%' })
      positions.push({ top: '68%', left: '50%' })
      positions.push({ top: '68%', left: '65%' })
      positions.push({ top: '72%', left: '85%' })
      positions.push({ top: '45%', left: '15%' })
      positions.push({ top: '40%', left: '50%' })
      positions.push({ top: '45%', left: '85%' })
      positions.push({ top: '15%', left: '30%' })
      positions.push({ top: '15%', left: '70%' })
      break
  }
  
  return positions.map(p => ({
    top: p.top,
    left: `calc(${p.left} - 22px)`,
  }))
}

function getPositionColor(abbr: string): string {
  switch (abbr) {
    case 'GR': return 'bg-amber-500'
    case 'LC': case 'DC': case 'RC': return 'bg-blue-500'
    case 'MC': case 'CDM': case 'CAM': return 'bg-purple-500'
    case 'EX': case 'CA': case 'AV': case 'LW': case 'RW': case 'ST': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export function TeamManagementClient() {
  const [formation, setFormation] = useState('4-3-3')
  const [activeTab, setActiveTab] = useState('formation')
  const [startingXI, setStartingXI] = useState(MOCK_STARTING_XI)
  const [substitutes] = useState(MOCK_SUBSTITUTES)
  const [isSaved, setIsSaved] = useState(false)

  const pitchPositions = getPitchPositions(formation)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleReset = () => {
    setStartingXI(MOCK_STARTING_XI)
    setFormation('4-3-3')
  }

  // Calculate team ratings
  const overallAvg = startingXI.reduce((sum, p) => sum + p.rating, 0) / startingXI.length
  const attackPlayers = startingXI.filter(p => ['EX', 'CA', 'AV', 'LW', 'RW', 'ST'].includes(p.positionAbbr))
  const midPlayers = startingXI.filter(p => ['MC', 'CDM', 'CAM'].includes(p.positionAbbr))
  const defPlayers = startingXI.filter(p => ['LC', 'DC', 'RC', 'LB', 'RB', 'CB'].includes(p.positionAbbr))
  const attackAvg = attackPlayers.length > 0 ? attackPlayers.reduce((s, p) => s + p.rating, 0) / attackPlayers.length : 0
  const midAvg = midPlayers.length > 0 ? midPlayers.reduce((s, p) => s + p.rating, 0) / midPlayers.length : 0
  const defAvg = defPlayers.length > 0 ? defPlayers.reduce((s, p) => s + p.rating, 0) / defPlayers.length : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/club"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your starting XI, formation, and tactics for upcoming matches
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2" variant={isSaved ? 'default' : 'default'}>
            <Save className="h-4 w-4" />
            {isSaved ? 'Saved!' : 'Save XI'}
          </Button>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Visualization only:</strong> The formation and tactics set here do not affect the
            match result on the console. The result is determined exclusively by the submitted scoreline.
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="formation" className="gap-2">
            <Trophy className="h-4 w-4" />
            Formation
          </TabsTrigger>
          <TabsTrigger value="squad" className="gap-2">
            <Users className="h-4 w-4" />
            Squad
          </TabsTrigger>
          <TabsTrigger value="discipline" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Cards & Injuries
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Formation Tab */}
        <TabsContent value="formation" className="mt-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Pitch */}
            <div className="flex-1">
              {/* Formation Selector */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Formation:</span>
                <Select value={formation} onValueChange={setFormation}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATIONS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pitch */}
              <div className="relative overflow-hidden rounded-xl border-2 border-green-700 bg-gradient-to-b from-green-600 via-green-500 to-green-600 shadow-lg"
                style={{ minHeight: '480px' }}
              >
                {/* Pitch lines */}
                <div className="absolute left-[5%] right-[5%] top-1/2 h-px bg-white/30" />
                <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
                <div className="absolute bottom-0 left-[20%] right-[20%] h-[12%] border border-white/25 border-b-0 rounded-t-sm" />
                <div className="absolute top-0 left-[20%] right-[20%] h-[12%] border border-white/25 border-t-0 rounded-b-sm" />
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />

                {/* Center circle label */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40">
                  GV
                </div>

                {/* Player positions */}
                {startingXI.slice(0, 11).map((player, idx) => {
                  const pos = pitchPositions[idx]
                  if (!pos) return null
                  const isGK = idx === 0
                  const size = isGK ? 'w-12 h-12' : 'w-10 h-10'
                  const bgColor = getPositionColor(player.positionAbbr)

                  return (
                    <div
                      key={player.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-300"
                      style={{ top: pos.top, left: pos.left }}
                    >
                      <div
                        className={cn(
                          'mx-auto flex items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-lg',
                          size,
                          bgColor,
                          player.isStar && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-green-600'
                        )}
                      >
                        {player.positionAbbr}
                      </div>
                      <div className="mt-0.5 whitespace-nowrap text-[9px] font-medium text-white drop-shadow-md">
                        {player.name}
                        {player.isStar && ' ⭐'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Side Panels */}
            <div className="w-full space-y-4 lg:w-[260px] lg:shrink-0">
              {/* Starting XI */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                    <Trophy className="h-3.5 w-3.5" />
                    Starting XI (11)
                  </h3>
                  <div className="space-y-1">
                    {startingXI.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"
                      >
                        <span
                          className={cn(
                            'inline-flex w-7 items-center justify-center rounded px-1 py-0.5 text-[9px] font-bold text-white',
                            getPositionColor(player.positionAbbr)
                          )}
                        >
                          {player.positionAbbr}
                        </span>
                        <span className="font-medium text-foreground">{player.name}</span>
                        <span className="ml-auto font-semibold text-muted-foreground">
                          {player.rating}
                          {player.isStar && <span className="ml-0.5 text-amber-500">⭐</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Substitutes */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <Users className="h-3.5 w-3.5" />
                    Substitutes (5)
                  </h3>
                  <div className="space-y-1">
                    {substitutes.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs"
                      >
                        <span className="inline-flex w-7 items-center justify-center rounded bg-gray-500 px-1 py-0.5 text-[9px] font-bold text-white">
                          {player.positionAbbr}
                        </span>
                        <span className="font-medium text-foreground">{player.name}</span>
                        <span className="ml-auto font-semibold text-muted-foreground">
                          {player.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Rating */}
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Team Rating
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overall:</span>
                      <span className="font-bold text-amber-500">{overallAvg.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attack:</span>
                      <span className="font-bold text-red-500">{attackAvg.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Midfield:</span>
                      <span className="font-bold text-purple-500">{midAvg.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Defense:</span>
                      <span className="font-bold text-blue-500">{defAvg.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unavailable Players */}
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Unavailable
                  </h3>
                  <div className="space-y-2 text-xs">
                    {MOCK_UNAVAILABLE.map((player) => (
                      <div key={player.id} className="rounded-md bg-red-50 px-3 py-2 dark:bg-red-950/30">
                        <div className="font-medium text-foreground">{player.name}</div>
                        <div className="mt-0.5 text-muted-foreground">
                          {player.yellowCards && (
                            <Badge variant="outline" className="mr-1 border-amber-300 text-amber-700">
                              {player.yellowCards}/{player.maxYellowCards} yellows
                            </Badge>
                          )}
                          {player.redCardSuspension && (
                            <Badge variant="outline" className="mr-1 border-red-300 text-red-700">
                              Red: suspended {player.redCardSuspension}
                            </Badge>
                          )}
                          {player.isInjured && (
                            <Badge variant="outline" className="border-red-300 text-red-700">
                              Injured: out 2 games
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Squad Tab */}
        <TabsContent value="squad">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold text-foreground">Full Squad Management</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  View and manage your complete squad roster, including detailed player profiles,
                  positions, and ratings. CSV/JSON import coming soon.
                </p>
                <Button variant="outline" disabled className="mt-2">
                  Import Squad (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discipline Tab */}
        <TabsContent value="discipline">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <ShieldAlert className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold text-foreground">Cards & Injuries</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Track yellow/red card accumulation and player injuries. Auto-suspension for red
                  cards and accumulated yellows.
                </p>
                <div className="mt-4 w-full max-w-md space-y-3">
                  {MOCK_UNAVAILABLE.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.positionAbbr} &middot; {player.rating}</p>
                      </div>
                      <div className="text-right text-xs">
                        {player.yellowCards && (
                          <p className="text-amber-600">{player.yellowCards}/{player.maxYellowCards} yellow cards</p>
                        )}
                        {player.redCardSuspension && (
                          <p className="text-red-600">Red card: suspended {player.redCardSuspension}</p>
                        )}
                        {player.isInjured && (
                          <p className="text-red-600">Medium injury: out 2 games</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link href="/team/disciplinary">
                      <ShieldAlert className="h-4 w-4" />
                      Full Disciplinary Panel
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold text-foreground">Player Statistics</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Detailed player performance metrics including goals, assists, tackles, passing
                  accuracy, and form ratings across all competitions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold text-foreground">Match History</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  View historical lineups, formations used, and results from previous matches.
                  Analyze what worked and what didn&apos;t.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
