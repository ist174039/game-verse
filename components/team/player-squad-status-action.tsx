'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlayerSquadStatusActionProps {
  universePlayerId: string
  status: string
  hasActiveContract: boolean
}

function friendlyError(message: string) {
  if (message.includes('active_player_contract_required')) return 'Este jogador precisa de um contrato ativo antes de entrar na primeira equipa ou reserva.'
  if (message.includes('player_status_not_manager_operational')) return 'Este estado é controlado por outra operação do jogo e não pode ser alterado aqui.'
  if (message.includes('not_player_owner')) return 'Este jogador já não pertence ao teu clube.'
  return message
}

export function PlayerSquadStatusAction({ universePlayerId, status, hasActiveContract }: PlayerSquadStatusActionProps) {
  const router = useRouter()
  const manageable = ['OWNED','ACTIVE','RESERVE'].includes(status)
  const [loading, setLoading] = useState<'ACTIVE' | 'RESERVE' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!manageable) return null

  async function change(targetStatus: 'ACTIVE' | 'RESERVE') {
    if (status === targetStatus || loading) return
    setLoading(targetStatus)
    setError(null)
    try {
      const response = await fetch('/api/team/player-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          universePlayerId,
          targetStatus,
          idempotencyKey: `player-status:${crypto.randomUUID()}`,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'operational_status_update_failed')
      router.refresh()
    } catch (cause) {
      setError(friendlyError(cause instanceof Error ? cause.message : 'Não foi possível alterar o estado do jogador.'))
    } finally {
      setLoading(null)
    }
  }

  if (!hasActiveContract) {
    return <div className="mt-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2 text-[10px] leading-4 text-amber-200/80">Contrato ativo em falta. O jogador não conta para a elegibilidade competitiva.</div>
  }

  return <div className="mt-2 space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <Button
        size="sm"
        variant={status === 'ACTIVE' ? 'secondary' : 'outline'}
        disabled={status === 'ACTIVE' || loading !== null}
        onClick={() => change('ACTIVE')}
      >
        <ShieldCheck className="h-3.5 w-3.5" />{loading === 'ACTIVE' ? 'A mover…' : '1ª equipa'}
      </Button>
      <Button
        size="sm"
        variant={status === 'RESERVE' ? 'secondary' : 'outline'}
        disabled={status === 'RESERVE' || loading !== null}
        onClick={() => change('RESERVE')}
      >
        <UsersRound className="h-3.5 w-3.5" />{loading === 'RESERVE' ? 'A mover…' : 'Reserva'}
      </Button>
    </div>
    {error && <p className="rounded-lg border border-destructive/20 bg-destructive/[0.05] px-3 py-2 text-[10px] leading-4 text-destructive">{error}</p>}
  </div>
}
