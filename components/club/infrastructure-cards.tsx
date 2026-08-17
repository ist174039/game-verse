import {
  Building2,
  Dumbbell,
  GraduationCap,
  Landmark,
  LockKeyhole,
  Megaphone,
} from 'lucide-react'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import type { ClubInfrastructure, InfrastructureCardType } from '@/lib/types'

interface InfrastructureCardsProps {
  infrastructure: ClubInfrastructure[]
  clubId: string
  balance: number
}

const INFRASTRUCTURE_CONFIG: Record<InfrastructureCardType, {
  name: string
  description: string
  icon: React.ReactNode
  capability: string
}> = {
  stadium: {
    name: 'Estádio',
    description: 'Capacidade, bilheteira, experiência dos adeptos e elegibilidade para eventos.',
    icon: <Building2 className="h-5 w-5" />,
    capability: 'Receita de jogo & capacidade',
  },
  academy: {
    name: 'Academia',
    description: 'Scouting, watchlists e melhor acesso ao mercado primário de jogadores.',
    icon: <GraduationCap className="h-5 w-5" />,
    capability: 'Scouting & acesso ao mercado',
  },
  training: {
    name: 'Centro de Treino',
    description: 'Preparação, disponibilidade operacional e recuperação do plantel.',
    icon: <Dumbbell className="h-5 w-5" />,
    capability: 'Preparação & disponibilidade',
  },
  marketing: {
    name: 'Marketing',
    description: 'Crescimento de adeptos, alcance do clube e qualidade das propostas de patrocínio.',
    icon: <Megaphone className="h-5 w-5" />,
    capability: 'Adeptos & patrocinadores',
  },
  finance: {
    name: 'Finanças',
    description: 'Crédito, projeções de cash-flow, condições de financiamento e controlo financeiro.',
    icon: <Landmark className="h-5 w-5" />,
    capability: 'Crédito & eficiência financeira',
  },
}

const CARD_TYPES: InfrastructureCardType[] = ['stadium', 'academy', 'training', 'marketing', 'finance']

export function InfrastructureCards({ infrastructure, balance }: InfrastructureCardsProps) {
  const getCardData = (type: InfrastructureCardType) => infrastructure.find((item) => item.card_type === type)

  return (
    <section className="clan-panel-neutral rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="clan-kicker">Infraestruturas</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Capacidade operacional do clube</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            Os níveis existentes são preservados. Novos upgrades económicos ficam bloqueados até serem migrados para o ledger Silver e para as novas regras de manutenção.
          </p>
        </div>
        <CurrencyDisplay kind="silver" amount={balance} compact label="Silver" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {CARD_TYPES.map((type) => {
          const config = INFRASTRUCTURE_CONFIG[type]
          const card = getCardData(type)
          const level = card?.level || 0

          return (
            <article
              key={type}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition ${
                level > 0
                  ? 'border-primary/15 bg-[rgba(245,191,22,.035)]'
                  : 'border-white/[0.055] bg-black/15'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  level > 0
                    ? 'border-primary/20 bg-primary/[0.07] text-primary'
                    : 'border-white/[0.06] bg-white/[0.025] text-muted-foreground'
                }`}>
                  {config.icon}
                </span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  level > 0 ? 'bg-primary/[0.08] text-primary' : 'bg-white/[0.035] text-muted-foreground'
                }`}>
                  Nível {level}
                </span>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-foreground">{config.name}</h3>
              <p className="mt-1.5 min-h-14 text-xs leading-5 text-muted-foreground">{config.description}</p>

              <div className="mt-4 border-t border-white/[0.05] pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Função</p>
                <p className="mt-1 text-xs font-medium text-foreground">{config.capability}</p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
                <LockKeyhole className="h-3.5 w-3.5 text-primary/70" />
                Upgrade disponível após migração económica
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
