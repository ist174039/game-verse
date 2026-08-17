import { ArrowDownLeft, ArrowUpRight, Clock3 } from 'lucide-react'
import type { CoinTransaction } from '@/lib/types'

interface RecentActivityProps {
  transactions: CoinTransaction[]
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  return (
    <section className="clan-panel-neutral overflow-hidden rounded-2xl">
      <div className="flex items-end justify-between gap-4 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div>
          <p className="clan-kicker">Atividade</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Movimentos recentes</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">Últimos 5</span>
      </div>

      <div className="px-2 pb-2 sm:px-3 sm:pb-3">
        {transactions.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-black/15 px-5 text-center">
            <Clock3 className="h-6 w-6 text-primary/65" />
            <p className="mt-3 text-sm font-medium text-foreground">Ainda não existem movimentos</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              As operações económicas e competitivas aparecerão aqui como eventos do ledger e do clube.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.055]">
            {transactions.map((tx) => {
              const credit = tx.type === 'credit'
              return (
                <div key={tx.id} className="flex items-center gap-3 px-2 py-3.5 sm:px-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                      credit
                        ? 'border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400'
                        : 'border-red-500/15 bg-red-500/[0.06] text-red-400'
                    }`}
                  >
                    {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{getTransactionLabel(tx.source_type)}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {tx.description || getDefaultDescription(tx.source_type)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-semibold tabular-nums ${credit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {credit ? '+' : '-'}{tx.amount.toLocaleString('pt-PT')}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{formatTimeAgo(tx.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function getTransactionLabel(sourceType: string): string {
  const labels: Record<string, string> = {
    match: 'Liquidação de partida',
    tournament: 'Prémio de competição',
    reward: 'Recompensa',
    purchase: 'Compra de moeda',
    admin: 'Ajuste administrativo',
    penalty: 'Penalização',
    market: 'Operação de mercado',
    fee: 'Taxa',
    infra_bonus: 'Infraestrutura',
    passive_finance: 'Movimento financeiro',
  }
  return labels[sourceType] || 'Movimento'
}

function getDefaultDescription(sourceType: string): string {
  const descriptions: Record<string, string> = {
    match: 'Movimento associado a uma partida',
    tournament: 'Liquidação de uma competição',
    reward: 'Recompensa atribuída pela plataforma',
    purchase: 'Operação de compra',
    admin: 'Operação auditada de administração',
    penalty: 'Penalização aplicada',
    market: 'Compra ou venda no mercado',
    fee: 'Taxa de serviço',
    infra_bonus: 'Movimento de infraestrutura',
    passive_finance: 'Movimento financeiro do clube',
  }
  return descriptions[sourceType] || 'Movimento registado'
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `há ${diffMins} min`
  if (diffHours < 24) return `há ${diffHours} h`
  if (diffDays < 7) return `há ${diffDays} d`
  return date.toLocaleDateString('pt-PT')
}
