'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Swords,
  MessageCircle,
  UserPlus,
  UserCheck,
  Trophy,
  Medal,
  TrendingUp,
  Flame,
  Gamepad2,
  Target,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserProfile, Club, MatchWithPlayers } from '@/lib/types'

interface ProfileClientProps {
  profile: UserProfile
  club: Club | null
  isOwnProfile: boolean
  friendStatus: 'none' | 'pending' | 'accepted' | 'blocked'
  h2hStats: {
    userWins: number
    profileWins: number
    draws: number
    totalMatches: number
    lastMatch: string | null
    lastMatchScore: string | null
  } | null
  recentMatches: MatchWithPlayers[]
}

export function ProfileClient({
  profile,
  club,
  isOwnProfile,
  friendStatus,
  h2hStats,
  recentMatches,
}: ProfileClientProps) {
  const router = useRouter()
  const [isSendingFriend, setIsSendingFriend] = useState(false)
  const [localFriendStatus, setLocalFriendStatus] = useState(friendStatus)

  const winRate = profile.games_played_valid > 0
    ? Math.round((h2hStats?.profileWins ?? 0) / Math.max(profile.games_played_valid, 1) * 100)
    : 0

  const getDivisionBadge = (elo: number) => {
    if (elo >= 1800) return { label: 'D1', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    if (elo >= 1600) return { label: 'D2', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
    if (elo >= 1400) return { label: 'D3', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    if (elo >= 1200) return { label: 'D4', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    return { label: 'D5', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
  }

  const division = getDivisionBadge(profile.elo_rating)

  const handleFriendAction = async () => {
    if (localFriendStatus !== 'none') return
    setIsSendingFriend(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('friend')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        friend_id: profile.id,
        status: 'pending',
      })

    if (!error) {
      setLocalFriendStatus('pending')
    }
    setIsSendingFriend(false)
  }

  const handleChallenge = () => {
    router.push(`/play?opponent=${profile.id}`)
  }

  const handleMessage = () => {
    router.push(`/social?chat=${profile.id}`)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-20 w-20 rounded-xl sm:h-24 sm:w-24">
                    <AvatarImage
                      src={profile.avatar_url || undefined}
                      alt={profile.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 text-2xl font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Prestige Level {profile.prestige_level}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {club?.name || profile.username}
                  </h1>
                  {club?.motto && (
                    <p className="mt-0.5 text-sm italic text-muted-foreground">
                      &ldquo;{club.motto}&rdquo;
                    </p>
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="mt-3 flex gap-2 sm:mt-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleChallenge}
                            className="gap-1.5"
                          >
                            <Swords className="h-4 w-4" />
                            <span className="hidden sm:inline">Challenge</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Create a match against {profile.username}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleFriendAction}
                      disabled={isSendingFriend || localFriendStatus !== 'none'}
                      className="gap-1.5"
                    >
                      {localFriendStatus === 'accepted' ? (
                        <UserCheck className="h-4 w-4 text-green-500" />
                      ) : localFriendStatus === 'pending' ? (
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {localFriendStatus === 'accepted'
                          ? 'Friends'
                          : localFriendStatus === 'pending'
                          ? 'Pending'
                          : 'Friend'}
                      </span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMessage}
                      className="gap-1.5"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Msg</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className={cn('border-0', division.color)}>
                  {division.label}
                </Badge>
                <Badge variant="secondary">
                  <Medal className="mr-1 h-3 w-3" />
                  Rank #{Math.max(1, 1050 - profile.elo_rating)}
                </Badge>
                <Badge variant="secondary">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Elo {profile.elo_rating}
                </Badge>
                <Badge variant="secondary">
                  <Trophy className="mr-1 h-3 w-3" />
                  Prestige {profile.prestige_level}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-4 w-4" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow label="Total Games" value={profile.games_played_valid.toString()} />
            <StatRow
              label="Win Rate"
              value={`${winRate}%`}
              valueClass={winRate >= 60 ? 'text-green-500' : winRate >= 40 ? 'text-yellow-500' : 'text-red-500'}
            />
            <StatRow
              label="League Score"
              value={(profile.elo_rating * 1.6).toFixed(0)}
              valueClass="text-primary font-bold"
            />
            <StatRow
              label="Elo Rating"
              value={profile.elo_rating.toString()}
              valueClass="text-primary font-bold"
            />
            <StatRow
              label="Prestige Level"
              value={profile.prestige_level.toString()}
            />
          </CardContent>
        </Card>

        {/* Head-to-Head or Club Info */}
        {!isOwnProfile && h2hStats ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Swords className="h-4 w-4" />
                H2H vs You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">You</p>
                  <p className="text-3xl font-extrabold text-green-500">{h2hStats.userWins}</p>
                  <p className="text-xs text-muted-foreground">wins</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-muted-foreground">VS</p>
                  <p className="text-xs text-muted-foreground">{h2hStats.totalMatches} matches</p>
                  <p className="text-xs text-muted-foreground">{h2hStats.draws} draws</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{profile.username}</p>
                  <p className="text-3xl font-extrabold text-blue-500">{h2hStats.profileWins}</p>
                  <p className="text-xs text-muted-foreground">wins</p>
                </div>
              </div>
              {h2hStats.lastMatch && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Last match: {h2hStats.lastMatchScore} &middot; {h2hStats.lastMatch}
                </p>
              )}
            </CardContent>
          </Card>
        ) : club ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Club Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="Wins" value={club.wins.toString()} valueClass="text-green-500" />
              <StatRow label="Draws" value={club.draws.toString()} valueClass="text-yellow-500" />
              <StatRow label="Losses" value={club.losses.toString()} valueClass="text-red-500" />
              <StatRow
                label="Total Games"
                value={club.total_games.toString()}
              />
              <StatRow
                label="Prestige Score"
                value={club.prestige_score.toString()}
                valueClass="text-primary font-bold"
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Recent Matches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Gamepad2 className="h-4 w-4" />
            Recent Matches
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/play?player=${profile.id}`}>
              View all <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentMatches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No matches played yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Opponent</th>
                    <th className="pb-2 font-medium">Result</th>
                    <th className="pb-2 font-medium">Mode</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMatches.map((match) => {
                    const isCreator = match.creator_id === profile.id
                    const opponent = isCreator ? match.opponent : match.creator
                    const myScore = isCreator ? match.creator_score : match.opponent_score
                    const oppScore = isCreator ? match.opponent_score : match.creator_score
                    const isWin = match.winner_id === profile.id
                    const isDraw = !match.winner_id && myScore !== null && oppScore !== null
                    const timeAgo = getTimeAgo(match.created_at)

                    return (
                      <tr key={match.id} className="border-b last:border-0">
                        <td className="py-2.5">
                          <Link
                            href={`/profile/${opponent?.id || match.opponent_id || match.creator_id}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {opponent?.username || 'Unknown'}
                          </Link>
                        </td>
                        <td className="py-2.5">
                          {myScore !== null && oppScore !== null ? (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                isWin
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : isDraw
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}
                            >
                              {isWin ? 'W' : isDraw ? 'D' : 'L'} {myScore}-{oppScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {match.match_type}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{timeAgo}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-base font-bold text-foreground', valueClass)}>{value}</span>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 30) return `${diffDays}d`
  return `${Math.floor(diffDays / 30)}mo`
}
