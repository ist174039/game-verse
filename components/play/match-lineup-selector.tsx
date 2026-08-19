'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface MatchLineupPlayerOption {
  id: string
  name: string
  position: string
  overall: number
  status: string
}

interface MatchLineupSelectorProps {
  matchId: string
  matchState: string
  players: MatchLineupPlayerOption[]
  initialPlayerIds: string[]
  initialFormation: string
  homeReady: boolean
  awayReady: boolean
  ownIsHome: boolean
}

const formations = ['4-3-3','4-2-3-1','4-4-2','3-5-2','5-3-2']

export function MatchLineupSelector({
  matchId,
  matchState,
  players,
  initialPlayerIds,
  initialFormation,
  homeReady,
  awayReady,
  ownIsHome,
}: MatchLineupSelectorProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(initialPlayerIds)
  const [formation, setFormation] = useState(initialFormation || '4-3-3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editable = matchState === 'READY'

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const ownReady = ownIsHome ? homeReady : awayReady
  const opponentReady = ownIsHome ? awayReady : homeReady

  function toggle(id: string) {
    if (!editable || loading) return
    setError(null)
    setSelected(current => {
      if (current.includes(id)) return current.filter(value => value !== id)
      if (current.length >= 11) return current
      return [...current, id]
    })
  }

  async function save() {
    if (selected.length !== 11) {
      setError('Seleciona exatamente 11 jogadores elegíveis.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/competition/lineup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, playerIds: selected, formation }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'save_lineup_failed')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'save_lineup_failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Onze inicial</p>
          <h2 className="mt-1 text-xl font-black">Convocatória competitiva da partida</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">Só entram jogadores do teu clube em ACTIVE ou RESERVE com contrato ativo. O adversário apenas vê se o teu onze está pronto, nunca a seleção de jogadores.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Readiness label="Casa" ready={homeReady} own={ownIsHome} />
          <Readiness label="Fora" ready={awayReady} own={!ownIsHome} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="formation">Formação</label>
          <select id="formation" value={formation} onChange={event => setFormation(event.target.value)} disabled={!editable || loading} className="mt-2 h-10 w-full rounded-lg border border-white/[0.09] bg-[#101010] px-3 text-sm font-bold outline-none focus:border-primary/40 disabled:opacity-50">
            {formations.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <div className="mt-4 rounded-lg border border-primary/12 bg-primary/[0.035] p-3">
            <p className="text-2xl font-black text-primary">{selected.length}<span className="text-sm text-muted-foreground">/11</span></p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">selecionados</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{ownReady ? 'Onze atualmente válido.' : editable ? 'Guarda 11 jogadores para ficares pronto.' : 'O onze não está válido neste estado.'}</p>
        </div>

        <div>
          {players.length < 11 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/[0.04] px-6 text-center"><Users className="h-8 w-8 text-destructive/70"/><p className="mt-3 text-sm font-black">Plantel competitivo insuficiente</p><p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">Tens apenas {players.length} jogadores elegíveis para o onze. Adquire ou regulariza contratos antes da partida.</p></div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {players.map(player => {
                const active = selectedSet.has(player.id)
                return <button key={player.id} type="button" disabled={!editable || loading} onClick={() => toggle(player.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${active ? 'border-primary/35 bg-primary/[0.07]' : 'border-white/[0.07] bg-white/[0.018] hover:border-white/[0.14]'}`}>
                  {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary"/> : <Circle className="h-4 w-4 shrink-0 text-white/20"/>}
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{player.name}</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.11em] text-muted-foreground">{player.position} · OVR {player.overall} · {player.status}</p></div>
                </button>
              })}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/[0.05] p-3 text-xs text-destructive">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className={`h-4 w-4 ${ownReady && opponentReady ? 'text-[var(--success)]' : 'text-primary'}`}/>{ownReady && opponentReady ? 'Ambos os clubes estão prontos para jogar.' : ownReady ? 'O teu onze está pronto; falta o adversário.' : 'Falta guardar o teu onze.'}</div>
        {editable && <Button onClick={save} disabled={loading || selected.length !== 11}>{loading ? 'A guardar…' : ownReady ? 'Atualizar onze' : 'Guardar onze'}</Button>}
      </div>
    </section>
  )
}

function Readiness({ label, ready, own }: { label: string; ready: boolean; own: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${ready ? 'border-[rgba(67,184,120,.22)] bg-[rgba(67,184,120,.06)] text-[var(--success)]' : 'border-white/[0.08] bg-white/[0.02] text-muted-foreground'}`}>{ready ? <CheckCircle2 className="h-3.5 w-3.5"/> : <Circle className="h-3.5 w-3.5"/>}{label}{own ? ' · tu' : ''}</span>
}
