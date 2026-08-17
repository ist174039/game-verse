import { CircleDollarSign, Coins, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CurrencyKind = 'gold' | 'silver' | 'bronze'

const currencyConfig = {
  gold: {
    label: 'Gold',
    icon: Gem,
    className: 'text-[var(--gold)]',
    surface: 'bg-[rgba(245,191,22,.07)] border-[rgba(245,191,22,.18)]',
  },
  silver: {
    label: 'Silver',
    icon: Coins,
    className: 'text-[var(--silver)]',
    surface: 'bg-white/[0.035] border-white/10',
  },
  bronze: {
    label: 'Bronze',
    icon: CircleDollarSign,
    className: 'text-[var(--bronze)]',
    surface: 'bg-[rgba(181,109,42,.07)] border-[rgba(181,109,42,.18)]',
  },
} as const

interface CurrencyDisplayProps {
  kind: CurrencyKind
  amount: number
  compact?: boolean
  className?: string
  label?: string
}

export function CurrencyDisplay({
  kind,
  amount,
  compact = false,
  className,
  label,
}: CurrencyDisplayProps) {
  const config = currencyConfig[kind]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex min-w-0 items-center border',
        compact ? 'gap-1.5 rounded-lg px-2.5 py-1.5' : 'gap-3 rounded-xl px-3.5 py-3',
        config.surface,
        className,
      )}
      aria-label={`${label || config.label}: ${amount.toLocaleString('pt-PT')}`}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-black/35',
          compact ? 'h-6 w-6' : 'h-9 w-9',
          config.className,
        )}
      >
        <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </span>
      <div className="min-w-0">
        {!compact && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label || config.label}
          </p>
        )}
        <p className={cn('truncate font-semibold tabular-nums text-foreground', compact ? 'text-sm' : 'text-lg')}>
          {amount.toLocaleString('pt-PT')}
          {compact && <span className={cn('ml-1 text-[10px] font-medium', config.className)}>{label || config.label}</span>}
        </p>
      </div>
    </div>
  )
}
