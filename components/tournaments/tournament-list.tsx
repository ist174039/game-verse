import { Swords } from 'lucide-react'
import { TournamentCard } from './tournament-card'
import type { Tournament } from '@/lib/types'

interface TournamentListProps {
  tournaments: Tournament[]
  userId: string
  title: string
  emptyMessage: string
}

export function TournamentList({ tournaments, userId, title, emptyMessage }: TournamentListProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Swords className="h-5 w-5 text-accent" />
        <h2 className="font-semibold text-foreground">{title}</h2>
        <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
          {tournaments.length}
        </span>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Swords className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
