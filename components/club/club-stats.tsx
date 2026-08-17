import { CalendarDays, Crown, Target, Trophy } from 'lucide-react'
import type { Club } from '@/lib/types'

interface ClubStatsProps {
  club: Club
}

export function ClubStats({ club }: ClubStatsProps) {
  const winRate = club.total_games > 0 ? Math.round((club.wins / club.total_games) * 100) : 0

  return (
    <section className="clan-panel-neutral rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="clan-kicker">Performance</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Resumo competitivo</h2>
        </div>
        <Crown className="h-5 w-5 text-primary/80" />
      </div>

      <div className="grid grid-cols-2 gap-y-5 divide-x-0 sm:grid-cols-4 sm:divide-x sm:divide-white/[0.055]">
        <Metric icon={<CalendarDays className="h-4 w-4" />} label="Jogos" value={club.total_games.toLocaleString('pt-PT')} />
        <Metric icon={<Trophy className="h-4 w-4" />} label="Vitórias" value={club.wins.toLocaleString('pt-PT')} premium />
        <Metric icon={<Target className="h-4 w-4" />} label="Win rate" value={`${winRate}%`} />
        <Metric icon={<Crown className="h-4 w-4" />} label="Prestígio" value={club.prestige_score.toLocaleString('pt-PT')} premium />
      </div>
    </section>
  )
}

function Metric({
  icon,
  label,
  value,
  premium = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  premium?: boolean
}) {
  return (
    <div className="min-w-0 px-2 sm:px-5 first:pl-0 last:pr-0">
      <div className={`mb-2 flex items-center gap-2 ${premium ? 'text-primary' : 'text-muted-foreground'}`}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${premium ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}
