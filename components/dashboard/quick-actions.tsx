import Link from 'next/link'
import { Gamepad2, Coins, Shield, Trophy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  const actions = [
    {
      label: 'Play Match',
      description: 'Start a quick match',
      icon: <Gamepad2 className="h-5 w-5" />,
      href: '/play',
      color: 'bg-primary/10 text-primary',
      disabled: true,
      badge: 'Coming Soon',
    },
    {
      label: 'Buy GameCoins',
      description: 'Get more coins to upgrade',
      icon: <Coins className="h-5 w-5" />,
      href: '/economy',
      color: 'bg-accent/10 text-accent',
      disabled: false,
    },
    {
      label: 'Upgrade Club',
      description: 'Improve your infrastructure',
      icon: <Shield className="h-5 w-5" />,
      href: '/club',
      color: 'bg-chart-3/10 text-chart-3',
      disabled: false,
    },
    {
      label: 'Join Tournament',
      description: 'Compete for prizes',
      icon: <Trophy className="h-5 w-5" />,
      href: '/tournaments',
      color: 'bg-chart-4/10 text-chart-4',
      disabled: true,
      badge: 'Coming Soon',
    },
  ]

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold text-foreground">Quick Actions</h2>
      </div>

      <div className="p-4 space-y-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.disabled ? '#' : action.href}
            className={`group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors ${
              action.disabled 
                ? 'cursor-not-allowed opacity-60' 
                : 'hover:bg-secondary/50 hover:border-primary/30'
            }`}
          >
            <div className={`rounded-lg p-2 ${action.color}`}>
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                {action.badge && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {action.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{action.description}</p>
            </div>
            {!action.disabled && (
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </Link>
        ))}
      </div>

      {/* Daily Reward Banner */}
      <div className="m-4 mt-0 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 p-4">
        <p className="text-sm font-medium text-foreground">Daily Reward Available!</p>
        <p className="text-xs text-muted-foreground mt-1">
          Log in daily to earn bonus GameCoins
        </p>
        <Button 
          size="sm" 
          className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled
        >
          Claim Reward (Soon)
        </Button>
      </div>
    </div>
  )
}
