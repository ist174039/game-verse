import { Crown, Medal, Target, Trophy } from 'lucide-react'
import type { UserProfile } from '@/lib/types'

interface UserRankCardProps {
  profile: UserProfile | null
  rank: number
}

export function UserRankCard({ profile, rank }: UserRankCardProps) {
  if (!profile) return null

  const rankTier = getRankTier(profile.elo_rating)

  return (
    <section className="clan-panel relative overflow-hidden rounded-2xl p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/85 to-transparent" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/[0.08] sm:h-20 sm:w-20">
            <span className="text-xl font-black tabular-nums text-primary sm:text-2xl">#{rank}</span>
            {rank <= 3 && <Crown className="absolute -right-1 -top-2 h-5 w-5 text-primary" />}
          </div>
          <div className="min-w-0">
            <p className="clan-kicker">A tua posição</p>
            <h2 className="mt-1 truncate text-xl font-bold text-foreground sm:text-2xl">{profile.username}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${rankTier.className}`}>
                {rankTier.name}
              </span>
              <span className="text-xs text-muted-foreground">Prestígio {profile.prestige_level}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/[0.055] lg:min-w-[360px]">
          <Metric icon={<Medal className="h-4 w-4" />} label="Elo" value={profile.elo_rating.toLocaleString('pt-PT')} premium />
          <Metric icon={<Target className="h-4 w-4" />} label="Jogos" value={profile.games_played_valid.toLocaleString('pt-PT')} />
          <Metric icon={<Trophy className="h-4 w-4" />} label="Rank" value={`#${rank}`} premium={rank <= 3} />
        </div>
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
    <div className="px-4 first:pl-0 last:pr-0">
      <div className={`mb-2 flex items-center gap-2 ${premium ? 'text-primary' : 'text-muted-foreground'}`}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold tabular-nums ${premium ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function getRankTier(elo: number): { name: string; className: string } {
  if (elo >= 2400) return { name: 'Lenda', className: 'border-primary/25 bg-primary/[0.08] text-primary' }
  if (elo >= 2000) return { name: 'Mestre', className: 'border-violet-400/20 bg-violet-400/[0.06] text-violet-300' }
  if (elo >= 1600) return { name: 'Diamante', className: 'border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-200' }
  if (elo >= 1400) return { name: 'Ouro', className: 'border-primary/20 bg-primary/[0.06] text-primary' }
  if (elo >= 1200) return { name: 'Prata', className: 'border-white/12 bg-white/[0.04] text-[var(--silver)]' }
  return { name: 'Bronze', className: 'border-[rgba(181,109,42,.24)] bg-[rgba(181,109,42,.07)] text-[var(--bronze)]' }
}
