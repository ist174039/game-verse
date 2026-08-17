'use client'

import Link from 'next/link'
import { Trophy, CheckCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/auth/language-selector'
import { useLanguage } from '@/lib/i18n'

export default function SignUpSuccessPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md text-center">
        {/* Language Selector */}
        <div className="mb-4 flex justify-end">
          <LanguageSelector />
        </div>

        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 glow-teal">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">{t('app.name')}</h1>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-3">{t('auth.success.title')}</h2>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <p className="text-muted-foreground">
            {t('auth.success.message')}
          </p>
        </div>

        <p className="text-sm text-muted-foreground mb-8">
          {t('auth.success.description')}
        </p>

        <Button asChild variant="outline" className="border-border hover:bg-secondary">
          <Link href="/auth/login">
            {t('auth.success.backToLogin')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
