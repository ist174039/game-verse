'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export interface CompetitionRegistrationReadiness {
  runtimeAvailable: boolean
  ready: boolean
  reason: string | null
  registrationOpen: boolean
  competitionStatus: string
  entryFee: number
  silverBalance: number
  silverSufficient: boolean
  clubId: string | null
  registrationState: string | null
  eligiblePlayers: number
  minSquadSize: number
  missingPlayers: number
  rosterEligible: boolean
  economicFrozen: boolean
}

interface Props {
  competitionId: string
  universeId: string
  entryFee: number
  silverBalance: number
  registrationState: string | null
  status: string
  readiness: CompetitionRegistrationReadiness | null
}

const ERROR_MESSAGES: Record<string, string> = {
  competition_not_found: 'A competição já não existe.',
  registration_closed: 'As inscrições desta competição estão fechadas.',
  club_required_in_universe: 'É necessário ter um clube neste universo para te inscreveres.',
  already_registered: 'O teu clube já está inscrito nesta competição.',
  economic_scope_frozen: 'A operação económica do clube está temporariamente bloqueada. Consulta o suporte ou a moderação.',
  club_silver_account_not_found: 'A conta Silver do clube ainda não está disponível.',
  insufficient_silver: 'O clube não tem Silver suficiente para pagar a taxa de entrada.',
  idempotency_key_conflict: 'Não foi possível reutilizar esta operação. Tenta novamente.',
  competition_runtime_not_migrated: 'A validação competitiva ainda não está disponível neste ambiente.',
  competition_registration_failed: 'Não foi possível concluir a inscrição.',
}

function messageFor(reason: string | null, readiness?: CompetitionRegistrationReadiness | null) {
  if (reason === 'competitive_roster_ineligible') {
    const missing = readiness?.missingPlayers ?? Math.max(0, (readiness?.minSquadSize ?? 0) - (readiness?.eligiblePlayers ?? 0))
    return missing > 0
      ? `Faltam ${missing} jogador${missing === 1 ? '' : 'es'} elegível${missing === 1 ? '' : 'eis'} para competir.`
      : 'O plantel competitivo não cumpre os requisitos desta competição.'
  }
  return reason ? ERROR_MESSAGES[reason] ?? reason : ''
}

export function CompetitionRegistrationClient({ competitionId, universeId, entryFee, silverBalance, registrationState, status, readiness }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registrationOpen = ['DRAFT', 'REGISTRATION', 'OPEN'].includes(status)
  const canRegister = !registrationState && registrationOpen && silverBalance >= entryFee && readiness?.runtimeAvailable === true && readiness.ready
  const blocker = readiness?.runtimeAvailable === false ? 'competition_runtime_not_migrated' : readiness?.reason ?? null

  async function register() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/competitions/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ competitionId, idempotencyKey: crypto.randomUUID() }),
      })
      const payload = await response.json()
      if (!response.ok) {
        const key = typeof payload.error === 'string' ? payload.error : 'competition_registration_failed'
        if (key === 'competitive_roster_ineligible' && payload.context) {
          const eligible = Number(payload.context.eligiblePlayers ?? 0)
          const required = Number(payload.context.requiredPlayers ?? 0)
          throw new Error(`Plantel competitivo insuficiente: ${eligible}/${required} jogadores elegíveis.`)
        }
        throw new Error(ERROR_MESSAGES[key] ?? key)
      }
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : ERROR_MESSAGES.competition_registration_failed)
    } finally {
      setLoading(false)
    }
  }

  if (registrationState) {
    const approved = registrationState === 'APPROVED'
    const registered = registrationState === 'REGISTERED'
    const positive = approved || registered
    return (
      <section className={`rounded-2xl border p-5 ${positive ? 'border-primary/15 bg-primary/[0.025]' : 'border-white/[0.07] bg-[#0b0b0b]'}`}>
        <p className="text-sm font-bold">{positive ? 'Clube inscrito' : `Inscrição ${registrationState}`}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {approved
            ? 'Inscrição aprovada. O calendário aparece assim que a competição for ativada.'
            : registered
              ? 'Registo concluído. Aguarda a ativação da competição e a geração do calendário pela plataforma.'
              : `Estado atual da inscrição: ${registrationState}.`}
        </p>
      </section>
    )
  }

  return (
    <>
      <section className="rounded-2xl border border-primary/15 bg-primary/[0.025] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold">Inscrição na competição</p>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              {entryFee > 0
                ? 'A plataforma valida plantel, estado competitivo, bloqueios económicos e Silver antes de liquidar a taxa e criar a inscrição.'
                : 'A plataforma valida plantel, estado competitivo e bloqueios económicos antes de criar a inscrição. Não existe débito de Silver.'}
            </p>
          </div>
          <Button disabled={!canRegister} onClick={() => { setError(null); setOpen(true) }}>
            {silverBalance < entryFee ? 'Silver insuficiente' : canRegister ? 'Inscrever clube' : 'Inscrição indisponível'}
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ReadinessItem label="Plantel competitivo" value={readiness?.runtimeAvailable ? `${readiness.eligiblePlayers}/${readiness.minSquadSize}` : '—'} ok={readiness?.rosterEligible === true} />
          <ReadinessItem label="Estado da competição" value={registrationOpen ? 'Inscrições abertas' : 'Fechadas'} ok={registrationOpen} />
          <ReadinessItem label="Saldo Silver" value={`${silverBalance.toLocaleString('pt-PT')} S`} ok={silverBalance >= entryFee} />
          <ReadinessItem label="Bloqueio económico" value={readiness?.runtimeAvailable ? readiness.economicFrozen ? 'Ativo' : 'Sem bloqueio' : '—'} ok={readiness?.runtimeAvailable === true && !readiness.economicFrozen} />
        </div>

        {blocker && !canRegister && (
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
            <p className="text-xs font-bold">A inscrição ainda não pode ser concluída</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{messageFor(blocker, readiness)}</p>
            {blocker === 'competitive_roster_ineligible' && <Button asChild size="sm" variant="outline" className="mt-3"><Link href={`/team?universe=${universeId}`}>Abrir plantel</Link></Button>}
            {blocker === 'economic_scope_frozen' && <Button asChild size="sm" variant="outline" className="mt-3"><Link href="/support">Abrir suporte</Link></Button>}
          </div>
        )}
      </section>

      <ConfirmationDialog
        open={open}
        onOpenChange={(next) => { if (!loading) setOpen(next) }}
        title="Confirmar inscrição"
        description={entryFee > 0 ? 'O débito em Silver e a inscrição serão registados de forma atómica e auditável no ledger.' : 'A inscrição será registada de forma idempotente, sem débito de Silver.'}
        confirmLabel={entryFee > 0 ? 'Pagar e inscrever' : 'Confirmar inscrição'}
        isLoading={loading}
        onConfirm={register}
      >
        <div className="space-y-3 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm">
          <Row label="Plantel elegível" value={readiness ? `${readiness.eligiblePlayers}/${readiness.minSquadSize}` : '—'} />
          <Row label="Saldo atual" value={`${silverBalance.toLocaleString('pt-PT')} S`} />
          <Row label="Taxa de entrada" value={`${entryFee.toLocaleString('pt-PT')} S`} />
          <Row label="Saldo após inscrição" value={`${(silverBalance - entryFee).toLocaleString('pt-PT')} S`} />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </ConfirmationDialog>
    </>
  )
}

function ReadinessItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className={`mt-1 text-xs font-black ${ok ? 'text-foreground' : 'text-muted-foreground'}`}>{value}</p></div>
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-black tabular-nums">{value}</span></div>
}
