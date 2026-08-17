'use client'

import { CalendarDays, Clock3, LockKeyhole, Swords, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CalendarClient({ userId: _userId }: { userId: string }) {
  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <p className="clan-kicker">Calendário</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Uma agenda central por universo.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Liga, Taça, torneios, janelas de transferências, deadlines e eventos oficiais convergem num único calendário. O scheduler impede colisões antes da publicação.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <CalendarRule icon={Swords} title="Partidas oficiais" text="Jornadas, eliminatórias, finais e remarcações aprovadas." />
        <CalendarRule icon={Trophy} title="Eventos de temporada" text="Inscrições, sorteios, transfer windows, settlement e transição de época." />
        <CalendarRule icon={Clock3} title="Conflitos" text="Um clube não pode ter dois compromissos oficiais incompatíveis no mesmo slot." />
      </section>

      <section className="clan-panel-neutral flex min-h-[420px] flex-col items-center justify-center rounded-2xl p-8 text-center">
        <CalendarDays className="h-10 w-10 text-primary/45" />
        <h2 className="mt-4 text-xl font-black">Calendário real ainda sem eventos</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Foi removido o calendário hardcoded de “June 2025”, jogos fictícios, sessões de treino e finais inventadas. Os eventos serão lidos de `UNIVERSE_CALENDAR` e das competições reais.</p>
        <Button disabled className="mt-6"><LockKeyhole className="mr-2 h-4 w-4" />Gerir calendário</Button>
      </section>
    </div>
  )
}

function CalendarRule({ icon: Icon, title, text }: { icon: typeof Swords; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
