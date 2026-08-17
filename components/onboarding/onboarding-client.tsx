'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Globe2, LockKeyhole, Shield, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OnboardingClient({ userId: _userId }: { userId: string }) {
  return (
    <div className="mx-auto max-w-5xl space-y-7 py-6">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-8 text-center sm:px-8">
        <Image src="/brand/clan-logo.svg" alt="Clã das Sombras" width={96} height={96} className="mx-auto h-24 w-24 object-contain" />
        <p className="clan-kicker mt-5">Onboarding</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Primeiro a identidade. Depois o universo. Só então o clube.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">O onboarding antigo criava um clube global e mostrava um starter pack fictício. Isso não é compatível com o modelo final. O utilizador é global; o clube existe dentro de um universo.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <OnboardingStep number="01" icon={UserRound} title="Identidade global" text="Conta única, perfil de manager, Gold, Bronze, reputação e achievements." active />
        <OnboardingStep number="02" icon={Globe2} title="Escolher universo" text="Universo Principal ou universo comunitário com regras e economia próprias." />
        <OnboardingStep number="03" icon={Shield} title="Criar clube" text="Nome, emblema e cores; recebe o Starting Silver definido pelas regras do universo." />
      </section>

      <section className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2 text-primary"><LockKeyhole className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Aguardando schema definitivo</p></div><h2 className="mt-2 text-xl font-black">Não vamos gravar um clube no modelo errado.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Quando o Supabase do Clã estiver ligado, este fluxo cria `UNIVERSE_MEMBERSHIP` e `CLUB` atomicamente, valida `UNIQUE(user_id, universe_id)` e aplica o orçamento inicial correto.</p></div>
          <Button asChild variant="outline" className="shrink-0 border-primary/20 text-primary"><Link href="/universos">Ver universos <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </div>
  )
}

function OnboardingStep({ number, icon: Icon, title, text, active = false }: { number: string; icon: typeof Shield; title: string; text: string; active?: boolean }) {
  return <article className={`rounded-2xl border p-5 ${active ? 'border-primary/20 bg-primary/[0.04]' : 'border-white/[0.07] bg-[#0b0b0b]'}`}><div className="flex items-center justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${active ? 'border-primary/20 bg-primary/[0.06] text-primary' : 'border-white/[0.07] bg-white/[0.02] text-muted-foreground'}`}><Icon className="h-4 w-4" /></div><span className="text-[10px] font-black tracking-[0.18em] text-muted-foreground">{number}</span></div><h2 className="mt-5 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article>
}
