'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import type { ReactNode } from 'react'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  icon?: ReactNode
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: ReactNode
}

export function PageHeader({
  icon,
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-6 space-y-3 sm:mb-7">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-xs text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1 rounded-md px-1 py-1 transition-colors hover:text-foreground"
          >
            <Home className="h-3 w-3" />
            Início
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex shrink-0 items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="rounded-md px-1 py-1 transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="px-1 py-1 font-medium text-foreground/80">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[.07] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="clan-display text-2xl text-foreground sm:text-[1.75rem]">{title}</h1>
            {description && (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end [&_[data-slot=button]]:min-w-0 [&_[data-slot=button]]:flex-1 sm:[&_[data-slot=button]]:flex-none">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
