'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface Props {
  competitionId: string
  entryFee: number
  silverBalance: number
  registrationState: string | null
  status: string
}

export function CompetitionRegistrationClient({ competitionId, entryFee, silverBalance, registrationState, status }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registrationOpen = ['DRAFT', 'REGISTRATION', 'OPEN'].includes(status)
  const canRegister = !registrationState && registrationOpen && silverBalance >= entryFee

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
      if (!response.ok) throw new Error(payload.error || 'competition_registration_failed')
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'competition_registration_failed')
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
        <p className="text-sm font-bold">Inscrição na competição</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {entryFee > 0
            ? 'A taxa de entrada e o registo do clube são liquidados na mesma operação transacional. Nenhuma inscrição é criada se o débito falhar.'
            : 'A inscrição não tem taxa de entrada. O registo do clube é feito numa única operação idempotente.'}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            <span>Saldo: <strong className="text-foreground">{silverBalance.toLocaleString('pt-PT')} S</strong></span>
            <span className="mx-2 text-white/20">•</span>
            <span>Entrada: <strong className="text-foreground">{entryFee.toLocaleString('pt-PT')} S</strong></span>
          </div>
          <Button disabled={!canRegister} onClick={() => { setError(null); setOpen(true) }}>
            {silverBalance < entryFee ? 'Silver insuficiente' : registrationOpen ? 'Inscrever clube' : 'Inscrição indisponível'}
          </Button>
        </div>
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
          <Row label="Saldo atual" value={`${silverBalance.toLocaleString('pt-PT')} S`} />
          <Row label="Taxa de entrada" value={`${entryFee.toLocaleString('pt-PT')} S`} />
          <Row label="Saldo após inscrição" value={`${(silverBalance - entryFee).toLocaleString('pt-PT')} S`} />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </ConfirmationDialog>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-black tabular-nums">{value}</span></div>
}
