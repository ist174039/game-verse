import { Shield, Trophy, TrendingUp, Building2 } from 'lucide-react'
import Link from 'next/link'
import type { Club, ClubInfrastructure } from '@/lib/types'

interface ClubOverviewProps {
  club: Club | null
  infrastructure: ClubInfrastructure[]
}

export function ClubOverview({ club, infrastructure }: ClubOverviewProps) {
  if (!club) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-muted-foreground">Loading club data...</p>
      </div>
    )
  }

  const winRate = club.total_games > 0 
    ? Math.round((club.wins / club.total_games) * 100) 
    : 0

  const infraCount = infrastructure.length
  const maxInfra = 5

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{club.name}</h2>
            <p className="text-sm text-muted-foreground">{club.motto || 'No motto set'}</p>
          </div>
        </div>
        <Link 
          href="/club"
          className="text-sm text-primary hover:underline"
        >
          Manage Club
        </Link>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-3">
        {/* Record */}
        <div className="rounded-lg bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Trophy className="h-4 w-4" />
            <span>Season Record</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-accent">{club.wins}</p>
              <p className="text-xs text-muted-foreground">W</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-muted-foreground">{club.draws}</p>
              <p className="text-xs text-muted-foreground">D</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">{club.losses}</p>
              <p className="text-xs text-muted-foreground">L</p>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-lg bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span>Win Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{winRate}%</p>
            <p className="text-sm text-muted-foreground">
              ({club.total_games} games)
            </p>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="rounded-lg bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Building2 className="h-4 w-4" />
            <span>Infrastructure</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{infraCount}</p>
            <p className="text-sm text-muted-foreground">/ {maxInfra} cards</p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
            <div 
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(infraCount / maxInfra) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Prestige Score */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Club Prestige Score</p>
            <p className="text-xl font-bold text-primary">{club.prestige_score.toLocaleString()} pts</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Club Created</p>
            <p className="text-sm text-foreground">
              {new Date(club.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
