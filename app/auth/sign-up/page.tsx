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

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(t('auth.signUp.passwordMismatch'))
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('auth.signUp.passwordTooShort'))
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
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
          <p className="text-sm text-muted-foreground">{t('app.taglineShort')}</p>
        </div>

        {/* Sign Up Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">{t('auth.signUp.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('auth.signUp.subtitle')}</p>
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-foreground">{t('auth.signUp.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.signUp.emailPlaceholder')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-foreground">{t('auth.signUp.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repeat-password" className="text-foreground">{t('auth.signUp.confirmPasswordLabel')}</Label>
              <Input
                id="repeat-password"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? t('auth.signUp.loading') : t('auth.signUp.submit')}
            </Button>
          </form>

          {/* OAuth Section */}
          <div className="relative my-6">
            <Separator className="absolute inset-0 top-1/2 -translate-y-1/2" />
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">
                {t('auth.signUp.orContinueWith')}
              </span>
            </div>
          </div>

          <OAuthButtons />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.signUp.hasAccount')}{' '}
            <Link href="/auth/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
              {t('auth.signUp.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
