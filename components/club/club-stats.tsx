import { Trophy, Target, TrendingUp, Calendar } from 'lucide-react'
import type { Club } from '@/lib/types'

interface ClubStatsProps {
  club: Club
}

export function ClubStats({ club }: ClubStatsProps) {
  const winRate = club.total_games > 0 
    ? Math.round((club.wins / club.total_games) * 100) 
    : 0

  const stats = [
    {
      label: 'Total Games',
      value: club.total_games,
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Wins',
      value: club.wins,
      icon: <Trophy className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      label: 'Prestige',
      value: club.prestige_score.toLocaleString(),
      icon: <Target className="h-5 w-5" />,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <div className={`rounded-lg ${stat.bgColor} p-2 ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
