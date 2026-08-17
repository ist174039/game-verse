'use client'

import { useLanguage } from '@/lib/i18n'
import { localeNames, localeFlags } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage()
  const locales = ['en', 'pt'] as const

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border border-border bg-background p-0.5',
        className,
      )}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
            locale === l
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
          aria-label={localeNames[l]}
          title={localeNames[l]}
        >
          <span className="text-sm leading-none">{localeFlags[l]}</span>
          <span className="hidden sm:inline">{localeNames[l]}</span>
        </button>
      ))}
    </div>
  )
}
