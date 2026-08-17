import { Swords, Plus, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { GuestBanner } from '@/components/layout/guest-banner'
import { TournamentList } from '@/components/tournaments/tournament-list'
import type { Tournament } from '@/lib/types'

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isGuest = user?.is_anonymous || false

  if (!user || isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Swords className="h-6 w-6 text-accent" />}
          title="Tournaments"
          description="Compete for glory and massive GameCoin prizes"
        />
        <GuestBanner
          icon={<Swords className="h-12 w-12" />}
          title="Sign in to join tournaments"
          description="Create an account or sign in to compete in tournaments, climb the brackets, and win GameCoin prizes."
        />
      </div>
    )
  }

  // Fetch tournaments
  const { data: tournaments } = await supabase
    .from('tournament')
    .select('*')
    .order('starts_at', { ascending: true })
    .limit(50)

  const allTournaments = (tournaments || []) as Tournament[]

  const upcomingTournaments = allTournaments.filter(
    (t) => t.status === 'registration'
  )
  const activeTournaments = allTournaments.filter(
    (t) => t.status === 'in_progress'
  )
  const pastTournaments = allTournaments.filter(
    (t) => t.status === 'completed' || t.status === 'cancelled'
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Swords className="h-6 w-6 text-accent" />
            Tournaments
          </h1>
          <p className="text-muted-foreground">
            Compete for glory and massive GameCoin prizes
          </p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 hidden sm:flex">
          <Plus className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <TournamentList
          tournaments={activeTournaments}
          userId={user.id}
          title="Active Tournaments"
          emptyMessage=""
        />
      )}

      {/* Upcoming Tournaments */}
      <TournamentList
        tournaments={upcomingTournaments}
        userId={user.id}
        title="Open for Registration"
        emptyMessage="No tournaments open for registration right now. Check back soon!"
      />

      {/* Past Tournaments */}
      {pastTournaments.length > 0 && (
        <TournamentList
          tournaments={pastTournaments}
          userId={user.id}
          title="Past Tournaments"
          emptyMessage=""
        />
      )}
    </div>
  )
}
