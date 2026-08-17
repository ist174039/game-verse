import { Crown, Medal, ShieldCheck, Trophy } from 'lucide-react'
import { CurrencyDisplay } from '@/components/clan/currency-display'

interface StatsCardsProps {
  silver: number
  gold?: number
  bronze?: number
  eloRating: number
  prestigeLevel: number
  gamesPlayed: number
}

export function StatsCards({
  silver,
  gold = 0,
  bronze = 0,
  eloRating,
  prestigeLevel,
  gamesPlayed,
}: StatsCardsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <div className="clan-panel-neutral rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="clan-kicker">Recursos</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Tesouraria</h2>
          </div>
          <p className="hidden max-w-xs text-right text-xs leading-5 text-muted-foreground sm:block">
            Gold e Bronze passam a usar o ledger global; o saldo atual é apresentado como Silver durante a migração.
          </p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <CurrencyDisplay kind="gold" amount={gold} />
          <CurrencyDisplay kind="silver" amount={silver} label="Silver" />
          <CurrencyDisplay kind="bronze" amount={bronze} />
        </div>
      </div>

      <div className="clan-panel-neutral rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <p className="clan-kicker">Competição</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
          <Metric
            icon={<Medal className="h-4 w-4" />}
            label="Elo"
            value={eloRating.toLocaleString('pt-PT')}
            helper={getRankFromElo(eloRating)}
          />
          <Metric
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Prestígio"
            value={prestigeLevel.toLocaleString('pt-PT')}
            helper={getPrestigeName(prestigeLevel)}
          />
          <Metric
            icon={<Trophy className="h-4 w-4" />}
            label="Jogos"
            value={gamesPlayed.toLocaleString('pt-PT')}
            helper="validados"
          />
        </div>
      </div>
    </section>
  )
}

function Metric({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-4">
      <div className="mb-3 flex items-center gap-2 text-primary">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">{value}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{helper}</p>
    </div>
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
