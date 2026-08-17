'use client'

import { useState } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  Sword,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { MatchWithPlayers } from '@/lib/types'

const stateConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATED: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  WAITING_CONFIRMATION: { label: 'Awaiting Confirmation', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  CONFIRMED_BY_ONE: { label: 'Partially Confirmed', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  DISPUTED: { label: 'Disputed', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
  ECONOMY_UPDATE: { label: 'Processing', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  RANKING_UPDATE: { label: 'Ranking Update', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: <Loader2 className="h-3 w-3" /> },
}

interface MatchCardProps {
  match: MatchWithPlayers
  userId: string
}

export function MatchCard({ match, userId }: MatchCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const router = useRouter()
  const config = stateConfig[match.state] || stateConfig.CREATED

  const isCreator = match.creator_id === userId
  const opponent = isCreator ? match.opponent : match.creator
  const opponentName = opponent?.username || 'Waiting for opponent...'

  const handleConfirm = async () => {
    setIsConfirming(true)
    const supabase = createClient()

    try {
      const newState = match.state === 'CONFIRMED_BY_ONE' ? 'CONFIRMED' : 'CONFIRMED_BY_ONE'
      await supabase
        .from('match')
        .update({ state: newState })
        .eq('id', match.id)
      router.refresh()
    } catch {
      // ignore
    } finally {
      setIsConfirming(false)
    }
  }

  const handleSubmitResult = async () => {
    // This would open a modal/redirect to submit result
    router.push(`/play/${match.id}/submit-result`)
  }

  const canConfirm = match.state === 'CREATED' || match.state === 'CONFIRMED_BY_ONE'
  const canSubmitResult = match.state === 'CONFIRMED'

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sword className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground capitalize">{match.match_type}</span>
        </div>
        <Badge
          variant="outline"
          className={`${config.color} text-xs`}
        >
          <span className="flex items-center gap-1">
            {config.icon}
            {config.label}
          </span>
        </Badge>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            vs <span className="text-primary">{opponentName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(match.created_at).toLocaleDateString('pt-PT', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {canConfirm && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-border"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            )}
            Confirm
          </Button>
        )}
        {canSubmitResult && (
          <Button
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmitResult}
          >
            Submit Result
          </Button>
        )}
      </div>
    </div>
  )
}
