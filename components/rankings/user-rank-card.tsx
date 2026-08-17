import { Trophy, TrendingUp, Target } from 'lucide-react'
import type { UserProfile } from '@/lib/types'

interface UserRankCardProps {
  profile: UserProfile | null
  rank: number
}

export function UserRankCard({ profile, rank }: UserRankCardProps) {
  if (!profile) return null

  const rankTier = getRankTier(profile.elo_rating)

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20 text-2xl font-bold text-primary">
            #{rank}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.username}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${rankTier.bgColor} ${rankTier.textColor}`}>
                {rankTier.name}
              </span>
              <span className="text-sm text-muted-foreground">
                Prestige {profile.prestige_level}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profile.elo_rating}</p>
            <p className="text-xs text-muted-foreground">ELO Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profile.games_played_valid}</p>
            <p className="text-xs text-muted-foreground">Games</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-accent">+0</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>
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
