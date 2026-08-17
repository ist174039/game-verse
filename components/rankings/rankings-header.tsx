import { Crown, Trophy } from 'lucide-react'

export function RankingsHeader() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(135deg,rgba(245,191,22,.08),rgba(8,8,8,.96)_42%)] px-5 py-6 shadow-panel sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute right-5 top-5 opacity-[0.06]">
        <Trophy className="h-36 w-36 text-primary" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="clan-kicker">Competição</span>
          </div>
          <h1 className="clan-display text-3xl text-foreground sm:text-4xl">Ranking</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Acompanha a força competitiva dos managers. O ranking atual ainda usa o Elo legado até ser migrado para ranking por clube e universo.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary sm:self-auto">
          <Trophy className="h-3.5 w-3.5" />
          Temporada atual
        </div>
      </div>
    </section>
  )
}
