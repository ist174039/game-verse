import { Crown, Medal, Star } from 'lucide-react'

interface Player {
  id: string
  username: string
  elo_rating: number
  prestige_level: number
  games_played_valid: number
}

interface LeaderboardTableProps {
  players: Player[]
  currentUserId: string
}

export function LeaderboardTable({ players, currentUserId }: LeaderboardTableProps) {
  return (
    <section className="clan-panel-neutral overflow-hidden rounded-2xl">
      <div className="flex items-end justify-between gap-4 px-4 pb-4 pt-5 sm:px-5">
        <div>
          <p className="clan-kicker">Leaderboard</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Top 50 managers</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">Ordenado por Elo</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-y border-white/[0.055] bg-white/[0.018]">
              <th className="w-20 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Rank</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Manager</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Elo</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prestígio</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Jogos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.045]">
            {players.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Ainda não existem managers classificados.
                </td>
              </tr>
            ) : (
              players.map((player, index) => {
                const rank = index + 1
                const isCurrentUser = player.id === currentUserId
                const rankTier = getRankTier(player.elo_rating)

                return (
                  <tr
                    key={player.id}
                    className={`transition ${
                      isCurrentUser
                        ? 'bg-primary/[0.055] shadow-[inset_3px_0_0_var(--gold)]'
                        : rank <= 3
                          ? 'bg-[linear-gradient(90deg,rgba(245,191,22,.035),transparent_42%)] hover:bg-primary/[0.035]'
                          : 'hover:bg-white/[0.025]'
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <RankBadge rank={rank} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold ${
                          rank <= 3 || isCurrentUser
                            ? 'border-primary/20 bg-primary/[0.07] text-primary'
                            : 'border-white/[0.055] bg-white/[0.025] text-muted-foreground'
                        }`}>
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`truncate text-sm font-semibold ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>{player.username}</p>
                            {isCurrentUser && <span className="text-[10px] uppercase tracking-[0.12em] text-primary/70">Tu</span>}
                          </div>
                          <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${rankTier.className}`}>
                            {rankTier.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-semibold tabular-nums text-foreground">{player.elo_rating.toLocaleString('pt-PT')}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm tabular-nums text-foreground">{player.prestige_level}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm tabular-nums text-muted-foreground">{player.games_played_valid}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl border border-primary/25 bg-primary/[0.08] px-2 text-primary glow-gold">
        <Crown className="h-4 w-4" />
        <span className="text-xs font-black">1</span>
      </div>
    )
  }

  if (rank === 2) {
    return <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-[var(--silver)]"><Medal className="h-4 w-4" /></div>
  }

  if (rank === 3) {
    return <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(181,109,42,.24)] bg-[rgba(181,109,42,.07)] text-[var(--bronze)]"><Medal className="h-4 w-4" /></div>
  }

  return <span className="inline-block w-9 text-center text-sm font-semibold tabular-nums text-muted-foreground">{rank}</span>
}

function getRankTier(elo: number): { name: string; className: string } {
  if (elo >= 2400) return { name: 'Lenda', className: 'border-primary/25 bg-primary/[0.08] text-primary' }
  if (elo >= 2000) return { name: 'Mestre', className: 'border-violet-400/20 bg-violet-400/[0.06] text-violet-300' }
  if (elo >= 1600) return { name: 'Diamante', className: 'border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-200' }
  if (elo >= 1400) return { name: 'Ouro', className: 'border-primary/20 bg-primary/[0.06] text-primary' }
  if (elo >= 1200) return { name: 'Prata', className: 'border-white/12 bg-white/[0.04] text-[var(--silver)]' }
  return { name: 'Bronze', className: 'border-[rgba(181,109,42,.24)] bg-[rgba(181,109,42,.07)] text-[var(--bronze)]' }
}
