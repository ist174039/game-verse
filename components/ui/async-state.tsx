import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'

type AsyncStateProps = {
  title: string
  description?: string
  className?: string
}

/** Shared loading state with a stable minimum height to reduce layout shift. */
export function LoadingState({ title, description, className = '' }: AsyncStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.015] p-6 text-center ${className}`}
    >
      <LoaderCircle className="size-5 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <span className="sr-only">A carregar</span>
    </div>
  )
}

export function EmptyState({ title, description, className = '' }: AsyncStateProps) {
  return (
    <div className={`flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.1] p-6 text-center ${className}`}>
      <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
}

export function ErrorState({ title, description, className = '' }: AsyncStateProps) {
  return (
    <div role="alert" className={`flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.035] p-6 text-center ${className}`}>
      <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
}
