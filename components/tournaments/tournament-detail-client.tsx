'use client'

import { Swords, Trophy, Calendar, Users, Coins, ArrowLeft, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import type { Tournament, TournamentMatch } from '@/lib/types'

interface TournamentDetailClientProps {
  tournament: Tournament
  tournamentMatches: TournamentMatch[]
  userId: string
  isRegistered: boolean
  balance: number
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    registration: 'Registration Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status] || status
}

const statusColor: Record<string, string> = {
  registration: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-secondary/30 text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function TournamentDetailClient({ tournament, tournamentMatches, userId, isRegistered, balance }: TournamentDetailClientProps) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
    setJoining(true)
    const supabase = createClient()
    await supabase.from('tournament_registration').insert({
      tournament_id: tournament.id,
      user_id: userId,
      status: 'confirmed',
    })
    router.refresh()
    setJoining(false)
  }

  const progressPercent = Math.round(
    (tournament.current_participants / tournament.max_participants) * 100
  )

  const bracketRounds = groupMatchesByRound(tournamentMatches)
  const maxRound = Math.max(...bracketRounds.keys(), 0)

  return (
    <div className="space-y-6">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tournaments
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-background p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
              </div>
              <p className="text-muted-foreground">{tournament.description}</p>
            </div>
            <Badge className={statusColor[tournament.status]}>
              {formatStatus(tournament.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
          <div className="p-4 text-center">
            <Coins className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{tournament.prize_pool.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Prize Pool (GC)</p>
          </div>
          <div className="p-4 text-center">
            <Users className="h-5 w-5 text-chart-3 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {tournament.current_participants}/{tournament.max_participants}
            </p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </div>
          <div className="p-4 text-center">
            <Calendar className="h-5 w-5 text-chart-4 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {new Date(tournament.starts_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-muted-foreground">Starts</p>
          </div>
          <div className="p-4 text-center">
            <Swords className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground capitalize">{tournament.format.replace('_', ' ')}</p>
            <p className="text-xs text-muted-foreground">Format</p>
          </div>
        </div>
      </div>

      {/* Registration Progress & Join */}
      {tournament.status === 'registration' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Registration Progress</span>
            <span className="text-sm text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />

          <div className="flex items-center justify-between mt-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Entry Fee: <span className="font-medium text-foreground">{tournament.entry_fee} GC</span>
              </p>
              {isRegistered && (
                <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                  <Check className="h-3 w-3 mr-1" /> Registered
                </Badge>
              )}
            </div>
            {!isRegistered && (
              <Button
                onClick={handleJoin}
                disabled={joining || balance < tournament.entry_fee}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trophy className="h-4 w-4 mr-2" />
                )}
                {balance < tournament.entry_fee ? 'Insufficient Balance' : 'Join Tournament'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bracket View */}
      {tournament.format === 'knockout' && tournamentMatches.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Tournament Bracket
          </h2>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-[600px]">
              {Array.from(bracketRounds.entries()).map(([round, matches]) => (
                <div key={round} className="flex-1 min-w-[180px]">
                  <div className="text-center text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    {round === maxRound ? 'Final' : round === maxRound - 1 ? 'Semi-Finals' : `Round ${round + 1}`}
                  </div>
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-lg border border-border bg-secondary/20 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${match.winner_id === match.player1_id ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                            {match.player1_id ? 'Player 1' : 'TBD'}
                          </span>
                          <span className="text-sm font-mono text-foreground">
                            {match.score_player1 ?? '-'}
                          </span>
                        </div>
                        <div className="border-t border-border my-1.5" />
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${match.winner_id === match.player2_id ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                            {match.player2_id ? 'Player 2' : 'TBD'}
                          </span>
                          <span className="text-sm font-mono text-foreground">
                            {match.score_player2 ?? '-'}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            match.status === 'completed' ? 'bg-chart-3' :
                            match.status === 'in_progress' ? 'bg-primary' : 'bg-muted-foreground'
                          }`} />
                          <span className="text-[10px] text-muted-foreground capitalize">{match.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prize Distribution */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Prize Distribution
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-primary/10 to-transparent p-3">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">1st Place</span>
            </span>
            <span className="font-bold text-primary">{Math.round(tournament.prize_pool * 0.5).toLocaleString()} GC</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-chart-4/10 to-transparent p-3">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-4" />
              <span className="font-medium text-foreground">2nd Place</span>
            </span>
            <span className="font-bold text-chart-4">{Math.round(tournament.prize_pool * 0.3).toLocaleString()} GC</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-chart-3/10 to-transparent p-3">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-3" />
              <span className="font-medium text-foreground">3rd Place</span>
            </span>
            <span className="font-bold text-chart-3">{Math.round(tournament.prize_pool * 0.2).toLocaleString()} GC</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function groupMatchesByRound(matches: TournamentMatch[]): Map<number, TournamentMatch[]> {
  const groups = new Map<number, TournamentMatch[]>()
  for (const match of matches) {
    const existing = groups.get(match.round) || []
    existing.push(match)
    groups.set(match.round, existing)
  }
  return groups
}
