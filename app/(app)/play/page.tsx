import { Gamepad2, TrendingUp, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CreateMatch } from '@/components/play/create-match'
import { MatchList } from '@/components/play/match-list'
import type { MatchWithPlayers } from '@/lib/types'

export default async function PlayPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isGuest = user?.is_anonymous || false

  // Show guest banner if not signed in
  if (!user || isGuest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              Play
            </h1>
            <p className="text-muted-foreground">
              Challenge opponents and climb the rankings
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-12 text-center">
          <Gamepad2 className="mb-4 h-12 w-12 text-amber-500" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">Sign in to Play</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            Create an account or sign in to challenge opponents, compete in tournaments, and climb the rankings.
          </p>
          <Link href="/auth/login">
            <Button className="bg-amber-500 text-white hover:bg-amber-600">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In / Register
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get user profile, wallet, and matches in parallel
  const [profileResult, walletResult, matchesResult] = await Promise.all([
    supabase.from('user_profile').select('*').eq('id', user.id).single(),
    supabase.from('wallet').select('*').eq('user_id', user.id).single(),
    supabase
      .from('match')
      .select('*, creator:creator_id(id, username, avatar_url, elo_rating), opponent:opponent_id(id, username, avatar_url, elo_rating)')
      .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileResult.data
  const wallet = walletResult.data
  const matches = (matchesResult.data || []) as unknown as MatchWithPlayers[]

  // Split into active and completed
  const activeMatches = matches.filter(
    (m) => !['ECONOMY_UPDATE', 'RANKING_UPDATE'].includes(m.state)
  )
  const completedMatches = matches.filter(
    (m) => ['ECONOMY_UPDATE', 'RANKING_UPDATE'].includes(m.state)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            Play
          </h1>
          <p className="text-muted-foreground">
            Challenge opponents and climb the rankings
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-sm text-accent font-medium">
            ELO: {profile?.elo_rating || 1200}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create Match Section */}
        <div className="lg:col-span-2">
          <CreateMatch
            userId={user.id}
            eloRating={profile?.elo_rating || 1200}
            balance={wallet?.balance || 0}
          />
        </div>

        {/* Matches List */}
        <div className="lg:col-span-3 space-y-6">
          <MatchList
            matches={activeMatches}
            userId={user.id}
            title="Active Matches"
            emptyMessage="No active matches. Create a new match to get started!"
            icon="active"
          />

          {completedMatches.length > 0 && (
            <MatchList
              matches={completedMatches}
              userId={user.id}
              title="Match History"
              emptyMessage=""
              icon="history"
            />
          )}
        </div>
      </div>
    </div>
  )
}
