'use client'

import Link from 'next/link'
import { Trophy, Gamepad2, Shield, Coins, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/auth/language-selector'
import { useLanguage } from '@/lib/i18n'

export function HomeContent() {
  const { t } = useLanguage()

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: t('home.features.club.title'),
      description: t('home.features.club.desc'),
    },
    {
      icon: <Gamepad2 className="h-8 w-8" />,
      title: 'Live Matches',
      description: 'Play real-time matches against other managers with dynamic gameplay mechanics.',
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: t('home.features.tournaments.title'),
      description: t('home.features.tournaments.desc'),
    },
    {
      icon: <Coins className="h-8 w-8" />,
      title: t('home.features.economy.title'),
      description: t('home.features.economy.desc'),
    },
  ]

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector className="mr-2" />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">{t('home.signIn')}</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth/sign-up">{t('home.cta')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:py-32">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Star className="h-4 w-4" />
              <span>{t('home.badge')}</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              {t('home.title')}
              <span className="block text-primary">{t('home.titleHighlight')}</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
              {t('home.subtitle')}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold">
                <Link href="/auth/sign-up">
                  {t('home.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-border">
                <Link href="/auth/login">
                  I Have an Account
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">{t('home.features.title')}</h2>
            <p className="mt-3 text-muted-foreground">A complete football management ecosystem</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Start?</h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of managers building their football empires
          </p>
          <Button size="lg" asChild className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth/sign-up">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{t('app.name')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {t('app.name')}. Football Gaming Platform.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
