import { Medal, Star } from 'lucide-react'

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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold text-foreground">Global Leaderboard</h2>
        <p className="text-sm text-muted-foreground">Top 50 managers by ELO rating</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Manager
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ELO
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prestige
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Games
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {players.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No players found. Be the first to climb the ranks!
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
                    className={`transition-colors ${
                      isCurrentUser 
                        ? 'bg-primary/5 border-l-2 border-l-primary' 
                        : 'hover:bg-secondary/20'
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {rank <= 3 ? (
                          <Medal className={`h-5 w-5 ${
                            rank === 1 ? 'text-yellow-400' :
                            rank === 2 ? 'text-gray-400' :
                            'text-orange-600'
                          }`} />
                        ) : (
                          <span className="w-5 text-center text-sm font-medium text-muted-foreground">
                            {rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                          isCurrentUser 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-medium ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                            {player.username}
                            {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${rankTier.bgColor} ${rankTier.textColor}`}>
                            {rankTier.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="font-semibold text-foreground">{player.elo_rating}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{player.prestige_level}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-muted-foreground">
                      {player.games_played_valid}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getRankTier(elo: number): { name: string; bgColor: string; textColor: string } {
  if (elo >= 2400) return { name: 'Legend', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400' }
  if (elo >= 2000) return { name: 'Master', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' }
  if (elo >= 1600) return { name: 'Diamond', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' }
  if (elo >= 1400) return { name: 'Gold', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' }
  if (elo >= 1200) return { name: 'Silver', bgColor: 'bg-gray-400/20', textColor: 'text-gray-400' }
  return { name: 'Bronze', bgColor: 'bg-orange-700/20', textColor: 'text-orange-600' }
}
