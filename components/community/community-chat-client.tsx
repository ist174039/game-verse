'use client'

import Link from 'next/link'
import { Hash, LockKeyhole, MessageCircle, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CommunityChatClient({ username }: { userId: string; username: string }) {
  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="clan-kicker">Chat</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Conversas ligadas ao contexto certo.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{username}, o novo chat terá canais de comunidade, universo, competição, partida e administração. Mensagens deixam de existir apenas no estado local do browser.</p></div>
          <Button asChild variant="outline" className="border-white/[0.08]"><Link href="/community"><Users className="mr-2 h-4 w-4" />Comunidade</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ChatScope icon={Users} title="Community Chat" text="Canais sociais definidos por cada comunidade e sujeitos à sua moderação." />
        <ChatScope icon={Hash} title="Universe Chat" text="General, competição e anúncios no contexto competitivo correspondente." />
        <ChatScope icon={MessageCircle} title="Match Chat" text="Coordenação de horário, remarcação e contexto de uma partida específica." />
      </section>

      <section className="clan-panel-neutral flex min-h-[440px] flex-col items-center justify-center rounded-2xl p-8 text-center">
        <MessageCircle className="h-10 w-10 text-primary/40" />
        <h2 className="mt-4 text-xl font-black">Chat real ainda não ligado</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Foram removidos canais, utilizadores online e mensagens fictícias. Também foi eliminado o envio que apenas alterava um array local e dava a falsa impressão de persistência.</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />REPORT · MUTE · BLOCK · WARN · SUSPEND · BAN</div>
        <Button disabled className="mt-6"><LockKeyhole className="mr-2 h-4 w-4" />Enviar mensagem</Button>
      </section>
    </div>
  )
}

function ChatScope({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
