'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { LanguageSelector } from '@/components/auth/language-selector'
import { useLanguage } from '@/lib/i18n'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trophy, Gamepad2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('general.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('general.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        {/* Language Selector */}
        <div className="mb-4 flex justify-end">
          <LanguageSelector />
        </div>

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 glow-gold">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t('app.name')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">{t('auth.login.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('auth.login.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-foreground">{t('auth.login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-foreground">{t('auth.login.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? t('auth.login.loading') : t('auth.login.submit')}
            </Button>
          </form>

          {/* OAuth Section */}
          <div className="relative my-6">
            <Separator className="absolute inset-0 top-1/2 -translate-y-1/2" />
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">
                {t('auth.login.orContinueWith')}
              </span>
            </div>
          </div>

          <OAuthButtons />

          <div className="relative my-4">
            <Separator className="absolute inset-0 top-1/2 -translate-y-1/2" />
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={handleGuestLogin}
            disabled={isLoading}
          >
            <Gamepad2 className="mr-2 h-4 w-4" />
            {isLoading ? t('auth.login.loading') : 'Continue as Guest'}
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <Link href="/auth/sign-up" className="text-primary underline underline-offset-4 hover:text-primary/80">
              {t('auth.login.createAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
