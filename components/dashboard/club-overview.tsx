import { ArrowUpRight, Building2, Shield, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import type { Club, ClubInfrastructure } from '@/lib/types'

interface ClubOverviewProps {
  club: Club | null
  infrastructure: ClubInfrastructure[]
}

export function ClubOverview({ club, infrastructure }: ClubOverviewProps) {
  if (!club) {
    return (
      <section className="clan-panel-neutral brand-watermark rounded-3xl p-6 sm:p-8">
        <p className="clan-kicker">Clube</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">O teu clube ainda não está disponível</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Assim que o novo modelo de Universo e Clube estiver ligado ao Supabase, esta área passa a ser a identidade central do manager.
        </p>
      </section>
    )
  }

  const winRate = club.total_games > 0 ? Math.round((club.wins / club.total_games) * 100) : 0
  const infraCount = infrastructure.length

  return (
    <section className="clan-panel brand-watermark relative overflow-hidden rounded-3xl p-5 shadow-panel sm:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
      <div className="relative grid gap-7 xl:grid-cols-[1.3fr_.7fr] xl:items-end">
        <div>
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/25 bg-black/45 sm:h-24 sm:w-24">
              {club.logo_url ? (
                <img src={club.logo_url} alt={`Emblema ${club.name}`} className="h-full w-full object-cover" />
              ) : (
                <img src="/brand/clan-logo.svg" alt="Clã das Sombras" className="h-[78%] w-[78%] object-contain" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_110%,rgba(245,191,22,.18),transparent_48%)]" />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p className="clan-kicker">Clube ativo</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                <h2 className="clan-display truncate text-2xl text-foreground sm:text-3xl">{club.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  <Shield className="h-3 w-3" />
                  Principal
                </span>
              </div>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{club.motto || 'Constrói a identidade, compete e deixa marca no universo.'}</p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
            <ClubMetric label="Vitórias" value={club.wins} accent />
            <ClubMetric label="Empates" value={club.draws} />
            <ClubMetric label="Derrotas" value={club.losses} />
            <ClubMetric label="Win rate" value={`${winRate}%`} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <InfoRow icon={<Trophy className="h-4 w-4" />} label="Prestígio" value={`${club.prestige_score.toLocaleString('pt-PT')} pts`} premium />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Infraestruturas" value={`${infraCount} ativas`} />
          <InfoRow icon={<Users className="h-4 w-4" />} label="Jogos oficiais" value={club.total_games.toLocaleString('pt-PT')} />
        </div>
      </div>

      <div className="relative mt-7 flex flex-col gap-3 border-t border-white/[0.055] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          A identidade competitiva pertence ao clube dentro do universo; o manager mantém a identidade global.
        </p>
        <Link href="/club" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition hover:text-[var(--gold-300)]">
          Gerir clube
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function ClubMetric({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function InfoRow({
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
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-black/25 px-3.5 py-3">
      <span className={premium ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className={`truncate text-sm font-semibold ${premium ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  )
}
