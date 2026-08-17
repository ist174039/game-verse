import { Coins, Trophy, Star, Gamepad2 } from 'lucide-react'

interface StatsCardsProps {
  balance: number
  eloRating: number
  prestigeLevel: number
  gamesPlayed: number
}

export function StatsCards({ balance, eloRating, prestigeLevel, gamesPlayed }: StatsCardsProps) {
  const stats = [
    {
      label: 'GameCoins',
      value: balance.toLocaleString(),
      icon: <Coins className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      suffix: 'GC',
    },
    {
      label: 'ELO Rating',
      value: eloRating.toLocaleString(),
      icon: <Trophy className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      suffix: getRankFromElo(eloRating),
    },
    {
      label: 'Prestige Level',
      value: prestigeLevel.toString(),
      icon: <Star className="h-5 w-5" />,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
      suffix: getPrestigeName(prestigeLevel),
    },
    {
      label: 'Games Played',
      value: gamesPlayed.toLocaleString(),
      icon: <Gamepad2 className="h-5 w-5" />,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      suffix: 'matches',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card/80"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <div className={`rounded-lg ${stat.bgColor} p-2 ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            <span className="ml-2 text-sm text-muted-foreground">{stat.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function getRankFromElo(elo: number): string {
  if (elo >= 2400) return 'Legend'
  if (elo >= 2000) return 'Master'
  if (elo >= 1600) return 'Diamond'
  if (elo >= 1400) return 'Gold'
  if (elo >= 1200) return 'Silver'
  return 'Bronze'
}

function getPrestigeName(level: number): string {
  const names = ['Rookie', 'Amateur', 'Semi-Pro', 'Professional', 'Elite', 'Legend']
  return names[Math.min(level - 1, names.length - 1)] || 'Rookie'
}
