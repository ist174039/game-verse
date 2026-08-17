'use client'

import Link from 'next/link'
import { ArrowLeft, LockKeyhole, MessageCircle, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrivateChatClient({ username }: { userId: string; username: string }) {
  return (
    <div className="space-y-7">
      <Link href="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Comunidade</Link>
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <p className="clan-kicker">Mensagens diretas</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Conversas privadas entre identidades reais.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{username}, as DMs serão persistidas e sujeitas a block/report. Foram retiradas as conversas e convites fictícios que existiam apenas em memória local.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DmRule icon={UserRound} title="Identidade global" text="A conversa pertence aos utilizadores, não aos clubes de um universo específico." />
        <DmRule icon={ShieldCheck} title="Privacidade & block" text="Bloquear um utilizador impede novas DMs sem apagar o audit trail necessário à moderação." />
        <DmRule icon={MessageCircle} title="Contexto explícito" text="Convites de jogo e referências a partidas são objetos estruturados, não texto que finge uma ação." />
      </section>

      <section className="clan-panel-neutral flex min-h-[430px] flex-col items-center justify-center rounded-2xl p-8 text-center">
        <MessageCircle className="h-10 w-10 text-primary/40" />
        <h2 className="mt-4 text-xl font-black">Nenhuma conversa carregada</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Quando o social schema estiver ativo, esta área lista threads reais, unread state e mensagens persistidas. Não mostramos utilizadores “online” ou mensagens inventadas.</p>
        <Button disabled className="mt-6"><LockKeyhole className="mr-2 h-4 w-4" />Nova mensagem</Button>
      </section>
    </div>
  )
}

function DmRule({ icon: Icon, title, text }: { icon: typeof UserRound; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
