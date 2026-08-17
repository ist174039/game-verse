'use client'

import Link from 'next/link'
import { Bell, Globe, LockKeyhole, MessageCircle, Newspaper, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CommunityPageClient({ username }: { username: string }) {
  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="clan-kicker">Comunidade</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">A competição cria histórias. A comunidade mantém-nas vivas.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Olá, {username}. Comunidades são sociais; universos são competitivos e económicos. O novo modelo mantém estes contextos separados e pode relacioná-los sem misturar dados.</p></div>
          <div className="flex gap-2"><Button variant="outline" asChild className="border-white/[0.08]"><Link href="/community/chat"><MessageCircle className="mr-2 h-4 w-4" />Chat</Link></Button><Button variant="outline" asChild className="border-white/[0.08]"><Link href="/community/dm"><Users className="mr-2 h-4 w-4" />Mensagens</Link></Button></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SocialDomain icon={Globe} title="Community Feed" detail="Posts criados por membros, anúncios e discussões. Separado do Jornal automático." />
        <SocialDomain icon={Newspaper} title="Universe Feed" detail="Resultados, transferências, sorteios, champions e eventos gerados pelo universo." />
        <SocialDomain icon={Users} title="Social Graph" detail="Follow unilateral, amizade bilateral, blocks e memberships globais do utilizador." />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="clan-panel-neutral rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Feed da comunidade</p><h2 className="mt-1 text-xl font-black">Sem conteúdo fabricado</h2></div><LockKeyhole className="h-5 w-5 text-primary" /></div>
          <div className="mt-6 flex min-h-64 flex-col items-center justify-center border-y border-white/[0.06] px-5 text-center"><MessageCircle className="h-8 w-8 text-primary/45" /><p className="mt-4 text-sm font-bold">O feed será alimentado por dados reais.</p><p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">Foram removidos os posts, rankings semanais e utilizadores “online” inventados que existiam nesta página. Publicação, likes e comentários serão ligados ao novo social schema e à moderação.</p><Button className="mt-5" disabled>Publicar</Button></div>
        </div>

        <div className="space-y-4">
          <GovernanceItem icon={ShieldCheck} title="Moderação" text="REPORT, MUTE, BLOCK, WARN, SUSPEND e BAN com logs e scopes social/competitivo/plataforma." />
          <GovernanceItem icon={Bell} title="Notificações" text="Críticas, competitivas, sociais e de engagement; o utilizador controla categorias não essenciais." />
          <GovernanceItem icon={Newspaper} title="Conteúdo confiável" text="Journal Article, Community Post e Announcement são objetos diferentes, com origem claramente visível." />
        </div>
      </section>
    </div>
  )
}

function SocialDomain({ icon: Icon, title, detail }: { icon: typeof Globe; title: string; detail: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary"><Icon className="h-4 w-4" /></div><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></article> }
function GovernanceItem({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><p className="text-sm font-black">{title}</p></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
