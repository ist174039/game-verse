'use client'

import Link from 'next/link'
import { Trophy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/auth/language-selector'
import { useLanguage } from '@/lib/i18n'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const { t } = useLanguage()

  return (
    <>
      {message ? (
        <p className="text-sm text-destructive mb-8 bg-destructive/10 rounded-lg p-3">
          {message}
        </p>
      ) : (
        <p className="text-muted-foreground mb-8">
          {t('auth.error.message')}
        </p>
      )}
    </>
  )
}

export default function AuthErrorPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md text-center">
        {/* Language Selector */}
        <div className="mb-4 flex justify-end">
          <LanguageSelector />
        </div>

        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">{t('app.name')}</h1>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-3">{t('auth.error.title')}</h2>

        <Suspense fallback={<p className="text-muted-foreground mb-8">{t('general.loading')}</p>}>
          <AuthErrorContent />
        </Suspense>

        <div className="flex flex-col gap-3">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth/login">
              {t('auth.error.backToLogin')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border hover:bg-secondary">
            <Link href="/auth/sign-up">
              {t('auth.error.createNewAccount')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
