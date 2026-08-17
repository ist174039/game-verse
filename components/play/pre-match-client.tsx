'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Play,
  RefreshCw,
  MessageCircle,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Swords,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TeamLineup {
  name: string
  emblem: string
  rank: string
  formation: string
  color: string
  players: {
    num: number
    name: string
    position: string
    positionAbbr: string
    rating: number
    isStar?: boolean
  }[]
  avgRating: number
}

const HOME_TEAM: TeamLineup = {
  name: 'CarloFC',
  emblem: '⚡',
  rank: '#47',
  formation: '4-3-3',
  color: 'from-amber-500 to-orange-600',
  players: [
    { num: 1, name: 'Mendes', position: 'GK', positionAbbr: 'GR', rating: 88 },
    { num: 3, name: 'Sousa', position: 'LB', positionAbbr: 'LC', rating: 81 },
    { num: 5, name: 'Carvalho', position: 'CB', positionAbbr: 'DC', rating: 83 },
    { num: 6, name: 'Pereira', position: 'CB', positionAbbr: 'DC', rating: 82 },
    { num: 2, name: 'Silva', position: 'RB', positionAbbr: 'RC', rating: 84 },
    { num: 8, name: 'Costa', position: 'CM', positionAbbr: 'MC', rating: 86 },
    { num: 4, name: 'Gomes', position: 'CM', positionAbbr: 'MC', rating: 85 },
    { num: 10, name: 'Alves', position: 'CM', positionAbbr: 'MC', rating: 83 },
    { num: 11, name: 'Nunes', position: 'RW', positionAbbr: 'EX', rating: 87 },
    { num: 9, name: 'Rodrigues ⭐', position: 'ST', positionAbbr: 'CA', rating: 93, isStar: true },
    { num: 7, name: 'Ferreira', position: 'LW', positionAbbr: 'EX', rating: 86 },
  ],
  avgRating: 85.4,
}

const AWAY_TEAM: TeamLineup = {
  name: 'StormFC',
  emblem: '🌪',
  rank: '#38',
  formation: '4-4-2',
  color: 'from-indigo-500 to-purple-600',
  players: [
    { num: 1, name: 'Torres', position: 'GK', positionAbbr: 'GR', rating: 86 },
    { num: 3, name: 'Castro', position: 'LB', positionAbbr: 'LC', rating: 80 },
    { num: 4, name: 'Pinto', position: 'CB', positionAbbr: 'DC', rating: 85 },
    { num: 5, name: 'Ramos', position: 'CB', positionAbbr: 'DC', rating: 82 },
    { num: 2, name: 'Martins', position: 'RB', positionAbbr: 'RC', rating: 83 },
    { num: 7, name: 'Fonseca', position: 'CM', positionAbbr: 'MC', rating: 87 },
    { num: 8, name: 'Barros', position: 'CM', positionAbbr: 'MC', rating: 84 },
    { num: 11, name: 'Xavier', position: 'CM', positionAbbr: 'MC', rating: 82 },
    { num: 10, name: 'Azevedo', position: 'CM', positionAbbr: 'MC', rating: 83 },
    { num: 9, name: 'Branco ⭐', position: 'ST', positionAbbr: 'AV', rating: 91, isStar: true },
    { num: 6, name: 'Cunha', position: 'ST', positionAbbr: 'AV', rating: 84 },
  ],
  avgRating: 84.3,
}

const H2H_RESULTS = [
  { result: 'W', score: '2-1', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { result: 'L', score: '1-3', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { result: 'W', score: '3-0', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { result: 'D', score: '1-1', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  { result: 'W', score: '2-1', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
]

function getPositionBg(abbr: string): string {
  switch (abbr) {
    case 'GR': return 'bg-amber-500'
    case 'LC': case 'DC': case 'RC': return 'bg-blue-500'
    case 'MC': case 'CDM': case 'CAM': return 'bg-purple-500'
    case 'EX': case 'CA': case 'AV': case 'LW': case 'RW': case 'ST': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

function ComparisonBar({ homeValue, label, awayValue, homePct, awayPct }: {
  homeValue: string
  label: string
  awayValue: string
  homePct: number
  awayPct: number
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-bold text-amber-500">{homeValue}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-indigo-500">{awayValue}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="rounded-l-full bg-amber-500 transition-all"
          style={{ width: `${homePct}%` }}
        />
        <div className="bg-muted" style={{ width: `${100 - homePct - awayPct}%` }} />
        <div
          className="rounded-r-full bg-indigo-500 transition-all"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  )
}

export function PreMatchClient() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/play"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pre-Match</h1>
          <p className="text-sm text-muted-foreground">
            Quarter-Finals &middot; Weekly Cup #47
          </p>
        </div>
      </div>

      {/* Match Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-6 sm:gap-12">
            {/* Home Team */}
            <div className="flex-1 text-center">
              <div
                className={cn(
                  'mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-3xl shadow-lg sm:h-20 sm:w-20',
                  HOME_TEAM.color
                )}
              >
                {HOME_TEAM.emblem}
              </div>
              <h2 className="text-lg font-bold text-foreground">{HOME_TEAM.name}</h2>
              <p className="text-xs text-muted-foreground">
                Rank {HOME_TEAM.rank} &middot; {HOME_TEAM.formation}
              </p>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-3xl font-black text-primary">VS</div>
              <Badge variant="secondary" className="mt-2">
                Quarter-Finals
              </Badge>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              <div
                className={cn(
                  'mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-3xl shadow-lg sm:h-20 sm:w-20',
                  AWAY_TEAM.color
                )}
              >
                {AWAY_TEAM.emblem}
              </div>
              <h2 className="text-lg font-bold text-foreground">{AWAY_TEAM.name}</h2>
              <p className="text-xs text-muted-foreground">
                Rank {AWAY_TEAM.rank} &middot; {AWAY_TEAM.formation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unavailable Players Warning */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Auto-validation before kickoff:</strong> 2 players were removed from the XI due
            to disciplinary/medical unavailability.
            <div className="mt-2 text-xs">
              CarloFC: Rodrigues (🟥 suspension 1/2) &middot; Nunes (🤕 injury 2 games)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Lineups */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-center text-sm font-bold text-foreground">
              {HOME_TEAM.emblem} {HOME_TEAM.name} &mdash; {HOME_TEAM.formation}
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Player</th>
                  <th className="pb-2 font-medium">Pos</th>
                  <th className="pb-2 text-right font-medium">OV</th>
                </tr>
              </thead>
              <tbody>
                {HOME_TEAM.players.map((p) => (
                  <tr
                    key={p.num}
                    className={cn(
                      'border-b last:border-0',
                      p.isStar && 'bg-amber-50 dark:bg-amber-950/20'
                    )}
                  >
                    <td className="py-1.5 text-muted-foreground">{p.num}</td>
                    <td className="py-1.5 font-medium text-foreground">
                      {p.name}
                    </td>
                    <td className="py-1.5">
                      <span
                        className={cn(
                          'inline-block rounded px-1.5 py-0.5 text-[9px] font-bold text-white',
                          getPositionBg(p.positionAbbr)
                        )}
                      >
                        {p.positionAbbr}
                      </span>
                    </td>
                    <td className={cn('py-1.5 text-right font-bold', p.isStar && 'text-amber-500')}>
                      {p.rating}
                      {p.isStar && ' ⭐'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 rounded-md bg-green-50 py-2 text-center text-xs font-bold text-green-700 dark:bg-green-950/20 dark:text-green-400">
              Avg Rating: {HOME_TEAM.avgRating}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-center text-sm font-bold text-foreground">
              {AWAY_TEAM.emblem} {AWAY_TEAM.name} &mdash; {AWAY_TEAM.formation}
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Player</th>
                  <th className="pb-2 font-medium">Pos</th>
                  <th className="pb-2 text-right font-medium">OV</th>
                </tr>
              </thead>
              <tbody>
                {AWAY_TEAM.players.map((p) => (
                  <tr
                    key={p.num}
                    className={cn(
                      'border-b last:border-0',
                      p.isStar && 'bg-amber-50 dark:bg-amber-950/20'
                    )}
                  >
                    <td className="py-1.5 text-muted-foreground">{p.num}</td>
                    <td className="py-1.5 font-medium text-foreground">
                      {p.name}
                    </td>
                    <td className="py-1.5">
                      <span
                        className={cn(
                          'inline-block rounded px-1.5 py-0.5 text-[9px] font-bold text-white',
                          getPositionBg(p.positionAbbr)
                        )}
                      >
                        {p.positionAbbr}
                      </span>
                    </td>
                    <td className={cn('py-1.5 text-right font-bold', p.isStar && 'text-amber-500')}>
                      {p.rating}
                      {p.isStar && ' ⭐'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 rounded-md bg-blue-50 py-2 text-center text-xs font-bold text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
              Avg Rating: {AWAY_TEAM.avgRating}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Comparison */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-foreground">
            <BarChart3 className="mr-1 inline h-4 w-4" />
            Stats Comparison
          </h3>
          <div className="space-y-4">
            <ComparisonBar
              homeValue="72%"
              label="Win Rate"
              awayValue="68%"
              homePct={48}
              awayPct={46}
            />
            <ComparisonBar
              homeValue="2.4"
              label="Goals/Game"
              awayValue="2.2"
              homePct={52}
              awayPct={48}
            />
            <ComparisonBar
              homeValue={HOME_TEAM.avgRating.toString()}
              label="Avg XI Rating"
              awayValue={AWAY_TEAM.avgRating.toString()}
              homePct={49}
              awayPct={48}
            />
            <ComparisonBar
              homeValue="93"
              label="Best Player OV"
              awayValue="91"
              homePct={50}
              awayPct={48}
            />
          </div>
        </CardContent>
      </Card>

      {/* Head-to-Head */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Swords className="mr-1 inline h-4 w-4" />
            Head-to-Head &mdash; Last 5 Matches
          </h3>
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {H2H_RESULTS.map((h, i) => (
              <span
                key={i}
                className={cn(
                  'inline-block rounded-full px-3 py-1.5 text-xs font-bold',
                  h.color
                )}
              >
                {h.result} {h.score}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {HOME_TEAM.name}: <strong className="text-foreground">3W 1D 1L</strong>
            &nbsp;&bull;&nbsp;
            {AWAY_TEAM.name}: <strong className="text-foreground">1W 1D 3L</strong>
          </p>
        </CardContent>
      </Card>

      {/* Disciplinary Status */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
            <ShieldAlert className="h-4 w-4" />
            Disciplinary Status (current competition)
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              Carvalho: 2 yellows (1 from suspension)
            </Badge>
            <Badge variant="outline" className="border-red-300 text-red-700">
              Rodrigues: straight red (serving 1/2)
            </Badge>
            <Badge variant="secondary">Rule: 3 yellows = 1 match ban</Badge>
          </div>
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" className="gap-2 px-8 text-base font-bold">
          <Play className="h-5 w-5" />
          START MATCH
        </Button>
        <Button variant="outline" size="lg" className="gap-2" asChild>
          <Link href="/team">
            <RefreshCw className="h-4 w-4" />
            Change Formation
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          Tournament Chat
        </Button>
      </div>
    </div>
  )
}
