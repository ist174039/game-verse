'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BracketClientProps {
  tournamentId: string
  tournamentName: string
}

const bracketData = [
  {
    round: 'Round of 16',
    matches: [
      { team1: 'Team A', team2: 'Team B', score1: null, score2: null },
      { team1: 'Team C', team2: 'Team D', score1: null, score2: null },
      { team1: 'Team E', team2: 'Team F', score1: null, score2: null },
      { team1: 'Team G', team2: 'Team H', score1: null, score2: null },
    ],
  },
  {
    round: 'Quarter-Finals',
    matches: [
      { team1: 'CarloFC', team2: 'Dragons FC', score1: 3, score2: 1 },
      { team1: 'TBD', team2: 'TBD', score1: null, score2: null },
      { team1: 'TBD', team2: 'TBD', score1: null, score2: null },
      { team1: 'TBD', team2: 'TBD', score1: null, score2: null },
    ],
  },
  {
    round: 'Semi-Finals',
    matches: [
      { team1: 'CarloFC', team2: 'TBD', score1: null, score2: null },
      { team1: 'TBD', team2: 'TBD', score1: null, score2: null },
    ],
  },
  {
    round: 'Final',
    matches: [
      { team1: 'TBD', team2: 'TBD', score1: null, score2: null },
    ],
  },
]

export function BracketClient({ tournamentId, tournamentName }: BracketClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Link href={`/tournaments/${tournamentId}`} className="hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs">{tournamentName}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Swords className="h-6 w-6 text-chart-4" />
            Tournament Bracket
          </h1>
          <p className="text-muted-foreground">Knockout stage — Visual bracket</p>
        </div>
      </div>

      {/* My Position Alert */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 flex items-center gap-2 text-sm">
        <Trophy className="h-4 w-4 text-amber-600" />
        <span className="text-amber-800 dark:text-amber-200">
          <strong>You are in the Quarter-Finals!</strong> CarloFC vs Dragons FC — Submit your result.
        </span>
      </div>

      {/* Bracket Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-[700px]">
          {bracketData.map((round, rIdx) => (
            <div key={round.round} className="flex-1 min-w-[160px]">
              <div className="text-center mb-4">
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                  {round.round}
                </Badge>
              </div>
              <div
                className="flex flex-col justify-around"
                style={{ height: `${Math.pow(2, bracketData.length - rIdx) * 70}px` }}
              >
                {round.matches.map((match, mIdx) => (
                  <div
                    key={mIdx}
                    className={`rounded-lg border p-2.5 ${
                      match.team1 === 'CarloFC'
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700'
                        : match.team1 !== 'TBD'
                        ? 'border-border bg-card'
                        : 'border-dashed border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium truncate ${
                        match.score1 && match.score2 && match.score1 > match.score2
                          ? 'text-green-600 font-bold'
                          : 'text-foreground'
                      }`}>
                        {match.team1 === 'CarloFC' ? '⭐ ' : ''}{match.team1}
                      </span>
                      {match.score1 !== null && (
                        <span className="text-xs font-bold text-foreground">{match.score1}</span>
                      )}
                    </div>
                    <div className="border-t border-border my-1" />
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium truncate ${
                        match.score1 && match.score2 && match.score2 > match.score1
                          ? 'text-green-600 font-bold'
                          : 'text-foreground'
                      }`}>
                        {match.team2}
                      </span>
                      {match.score2 !== null && (
                        <span className="text-xs font-bold text-foreground">{match.score2}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winner Trophy */}
      <Card className="p-6 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h3 className="text-lg font-bold text-foreground">Champion</h3>
        <p className="text-sm text-muted-foreground">The winner will be crowned here</p>
      </Card>
    </div>
  )
}
