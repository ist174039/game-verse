'use client'

import { AlertTriangle, CheckCircle2, Clock, LockKeyhole, Shield, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MatchWithPlayers } from '@/lib/types'

const stateLabels: Record<string, string> = {
  CREATED: 'Criada',
  WAITING_CONFIRMATION: 'Aguardar confirmação',
  CONFIRMED_BY_ONE: 'Confirmação parcial',
  CONFIRMED: 'Confirmada',
  DISPUTED: 'Em disputa',
  AUTO_CONFIRMED: 'Auto-confirmada',
  ECONOMY_UPDATE: 'Liquidação antiga',
  RANKING_UPDATE: 'Ranking antigo',
}

export function MatchCard({ match, userId }: { match: MatchWithPlayers; userId: string }) {
  const isCreator = match.creator_id === userId
  const self = isCreator ? match.creator : match.opponent
  const opponent = isCreator ? match.opponent : match.creator
  const hasScore = match.creator_score != null && match.opponent_score != null
  const selfScore = isCreator ? match.creator_score : match.opponent_score
  const opponentScore = isCreator ? match.opponent_score : match.creator_score
  const disputed = match.state === 'DISPUTED'
  const confirmed = ['CONFIRMED', 'AUTO_CONFIRMED', 'ECONOMY_UPDATE', 'RANKING_UPDATE'].includes(match.state)

  return (
    <article className="rounded-xl border border-white/[0.07] bg-[#0b0b0b] p-4 transition hover:border-primary/18">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><Swords className="h-4 w-4 text-primary" />{match.match_type}</div>
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${disputed ? 'border-destructive/25 bg-destructive/[0.07] text-destructive' : confirmed ? 'border-[rgba(67,184,120,.2)] bg-[rgba(67,184,120,.06)] text-[var(--success)]' : 'border-white/[0.08] bg-white/[0.02] text-muted-foreground'}`}>
          {disputed ? <AlertTriangle className="h-3 w-3" /> : confirmed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {stateLabels[match.state] || match.state}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Team name={self?.username || 'Tu'} align="right" />
        <div className="min-w-20 text-center">
          {hasScore ? <p className="text-3xl font-black tracking-[-0.06em]">{selfScore} <span className="text-white/20">—</span> {opponentScore}</p> : <p className="text-sm font-black uppercase tracking-[0.16em] text-white/25">VS</p>}
        </div>
        <Team name={opponent?.username || 'Adversário'} align="left" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <p className="text-[10px] text-muted-foreground">{new Date(match.created_at).toLocaleString('pt-PT')}</p>
        <Button size="sm" variant="outline" disabled className="border-white/[0.08]"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" />Fluxo legado</Button>
      </div>
    </article>
  )
}

function Team({ name, align }: { name: string; align: 'left' | 'right' }) {
  return <div className={`flex min-w-0 items-center gap-2 ${align === 'right' ? 'justify-end text-right' : ''}`}>{align === 'left' && <Shield className="h-5 w-5 shrink-0 text-white/25" />}<p className="truncate text-sm font-bold text-foreground">{name}</p>{align === 'right' && <Shield className="h-5 w-5 shrink-0 text-primary/70" />}</div>
}
