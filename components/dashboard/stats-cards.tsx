import { Coins, Gamepad2, Medal, ShieldCheck } from 'lucide-react'

interface StatsCardsProps {
  balance: number
  eloRating: number
  prestigeLevel: number
  gamesPlayed: number
}

export function StatsCards({ balance, eloRating, prestigeLevel, gamesPlayed }: StatsCardsProps) {
  const stats = [
    {
      label: 'Saldo atual',
      value: balance.toLocaleString('pt-PT'),
      icon: Coins,
      suffix: 'legacy',
      hint: 'Será migrado para Gold / Silver / Bronze',
    },
    {
      label: 'Rating competitivo',
      value: eloRating.toLocaleString('pt-PT'),
      icon: Medal,
      suffix: getRankFromElo(eloRating),
      hint: 'Classificação competitiva atual',
    },
    {
      label: 'Prestígio',
      value: prestigeLevel.toString(),
      icon: ShieldCheck,
      suffix: getPrestigeName(prestigeLevel),
      hint: 'Progressão e reputação do clube',
    },
    {
      label: 'Jogos disputados',
      value: gamesPlayed.toLocaleString('pt-PT'),
      icon: Gamepad2,
      suffix: 'partidas',
      hint: 'Histórico competitivo validado',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <article
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/75 p-5 shadow-panel backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-primary/35"
          >
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 bg-[radial-gradient(circle_at_top_right,oklch(0.73_0.16_78/0.13),transparent_70%)] opacity-70 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="text-xs font-medium text-primary">{stat.suffix}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{stat.hint}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_22px_oklch(0.73_0.16_78/0.08)]">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="relative mt-4 h-px bg-gradient-to-r from-primary/35 via-border to-transparent" />
            <div className="relative mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              0{index + 1} · Clã das Sombras
            </div>
          </article>
        )
      })}
    </section>
  )
}

function getRankFromElo(elo: number): string {
  if (elo >= 2400) return 'Lenda'
  if (elo >= 2000) return 'Mestre'
  if (elo >= 1600) return 'Diamante'
  if (elo >= 1400) return 'Ouro'
  if (elo >= 1200) return 'Prata'
  return 'Bronze'
}

function getPrestigeName(level: number): string {
  const names = ['Rookie', 'Amador', 'Semi-Pro', 'Profissional', 'Elite', 'Lenda']
  return names[Math.min(Math.max(level - 1, 0), names.length - 1)]
}
