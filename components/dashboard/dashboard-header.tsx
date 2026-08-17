import { Crown, Sparkles } from 'lucide-react'

interface DashboardHeaderProps {
  username: string
  isNewUser: boolean
}

export function DashboardHeader({ username, isNewUser }: DashboardHeaderProps) {
  const greeting = getGreeting()

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/70 px-5 py-6 shadow-panel backdrop-blur-xl sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.73_0.16_78/0.16),transparent_35%)]" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute -right-4 -top-8 h-32 w-32 rounded-full border border-primary/10" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <Crown className="h-4 w-4" />
            Centro de comando
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {greeting}, {username}
            </h1>
            {isNewUser && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Novo membro
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Acompanha o teu clube, competição e economia a partir de uma única visão operacional.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/40 px-3 py-2 text-xs text-muted-foreground backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_oklch(0.73_0.16_78/0.8)]" />
          Sessão ativa
        </div>
      </div>
    </section>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
