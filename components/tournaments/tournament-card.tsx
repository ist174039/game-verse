'use client'

import { useState } from 'react'
import {
  Trophy,
  Users,
  Coins,
  Calendar,
  Loader2,
  CheckCircle2,
  Swords,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Tournament } from '@/lib/types'

const formatLabels: Record<string, string> = {
  knockout: 'Knockout',
  round_robin: 'Round Robin',
  swiss: 'Swiss',
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  registration: { label: 'Registration Open', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
}

interface TournamentCardProps {
  tournament: Tournament
  userId: string
}

export function TournamentCard({ tournament, userId }: TournamentCardProps) {
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()
  const statusCfg = statusConfig[tournament.status] || statusConfig.registration
  const isCreator = tournament.creator_id === userId
  const canJoin = tournament.status === 'registration' && !isCreator &&
    tournament.current_participants < tournament.max_participants

  const handleJoin = async () => {
    setIsJoining(true)
    const supabase = createClient()

    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('tournament_registration')
        .select('id')
        .eq('tournament_id', tournament.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        router.push(`/tournaments/${tournament.id}`)
        return
      }

      // Check balance if entry fee > 0
      if (tournament.entry_fee > 0) {
        const { data: wallet } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', userId)
          .single()

        if (!wallet || wallet.balance < tournament.entry_fee) {
          alert('Insufficient balance to join this tournament.')
          setIsJoining(false)
          return
        }
      }

      await supabase
        .from('tournament_registration')
        .insert({
          tournament_id: tournament.id,
          user_id: userId,
          seed: Math.floor(Math.random() * tournament.max_participants) + 1,
          status: 'confirmed',
        })

      // Update participant count
      await supabase
        .from('tournament')
        .update({ current_participants: tournament.current_participants + 1 })
        .eq('id', tournament.id)

      router.refresh()
    } catch {
      // ignore
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/20 hover:shadow-sm">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-accent/10 to-primary/5 p-5 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/20 p-2">
              <Swords className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{tournament.name}</h3>
              {tournament.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">{tournament.description}</p>
              )}
            </div>
          </div>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Prize Pool</p>
              <p className="font-semibold text-foreground">{tournament.prize_pool.toLocaleString()} GC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Entry Fee</p>
              <p className="font-semibold text-foreground">
                {tournament.entry_fee > 0 ? `${tournament.entry_fee.toLocaleString()} GC` : 'Free'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-chart-3" />
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="font-semibold text-foreground">
                {tournament.current_participants}/{tournament.max_participants}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-chart-4" />
            <div>
              <p className="text-xs text-muted-foreground">Format</p>
              <p className="font-semibold text-foreground">{formatLabels[tournament.format] || tournament.format}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Registration</span>
            <span>{Math.round((tournament.current_participants / tournament.max_participants) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(tournament.current_participants / tournament.max_participants) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Starts {new Date(tournament.starts_at).toLocaleDateString('pt-PT')}
          </span>
          {isCreator && (
            <Badge variant="outline" className="text-xs">Your Tournament</Badge>
          )}
        </div>

        {canJoin && (
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {tournament.entry_fee > 0 ? `Join for ${tournament.entry_fee} GC` : 'Join Free'}
          </Button>
        )}

        {tournament.status === 'in_progress' && (
          <Button
            variant="outline"
            className="w-full border-border"
            onClick={() => router.push(`/tournaments/${tournament.id}`)}
          >
            View Bracket
          </Button>
        )}
      </div>
    </div>
  )
}
