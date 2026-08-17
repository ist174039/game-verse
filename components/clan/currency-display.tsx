import { CircleDollarSign, Coins, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CurrencyKind = 'gold' | 'silver' | 'bronze'

const currencyConfig = {
  gold: {
    label: 'Gold',
    icon: Gem,
    className: 'text-[var(--brand-gold)]',
    surface: 'bg-[color:var(--brand-gold-muted)] border-[color:var(--border-active)]',
  },
  silver: {
    label: 'Silver',
    icon: Coins,
    className: 'text-[var(--currency-silver)]',
    surface: 'bg-white/[0.035] border-white/10',
  },
  bronze: {
    label: 'Bronze',
    icon: CircleDollarSign,
    className: 'text-[var(--currency-bronze)]',
    surface: 'bg-amber-950/15 border-amber-700/20',
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
        <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'} />
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
