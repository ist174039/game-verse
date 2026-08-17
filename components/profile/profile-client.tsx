'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Award, Globe2, LockKeyhole, Shield, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UserProfile, Club } from '@/lib/types'

export function ProfileClient({ profile, legacyClub, isOwnProfile }: { profile: UserProfile; legacyClub: Club | null; isOwnProfile: boolean }) {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section className="brand-watermark overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-7">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/18 bg-primary/[0.05]">
            {profile.avatar_url ? <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" /> : <UserRound className="h-10 w-10 text-primary/60" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="clan-kicker">Manager global</p>
            <h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em]">{profile.username}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Identidade única em toda a plataforma. Clubes, Elo, adeptos e prestígio competitivo serão apresentados por universo, não fundidos neste perfil.</p>
            <div className="mt-4 flex flex-wrap gap-2"><IdentityBadge label={`Manager Level legado ${profile.prestige_level}`} /><IdentityBadge label={`${profile.games_played_valid} jogos registados`} /><IdentityBadge label={profile.locale || 'pt'} /></div>
          </div>
          {isOwnProfile && <Button variant="outline" disabled className="border-white/[0.08]"><LockKeyhole className="mr-2 h-4 w-4" />Editar perfil</Button>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ProfileDomain icon={Award} title="Manager Level" text="Progressão global permanente. Desbloqueia status, cosméticos e capacidade operacional — nunca rating de jogadores." />
        <ProfileDomain icon={ShieldCheck} title="Reputação" text="Fiabilidade e comportamento: confirmações, no-shows, disputas abusivas e conduta comunitária." />
        <ProfileDomain icon={Globe2} title="Carreira multi-universo" text="Cada universo terá o seu clube, Elo, divisão, adeptos, património e troféus próprios." />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Clubes</p><h2 className="mt-1 text-xl font-black">Contextos competitivos</h2></div><Shield className="h-5 w-5 text-primary" /></div>
        {legacyClub ? (
          <div className="mt-5 flex flex-col gap-4 border-y border-white/[0.06] py-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary">Clube legado · universo ainda não definido</p><p className="mt-1 text-lg font-black">{legacyClub.name}</p><p className="mt-1 text-xs text-muted-foreground">{legacyClub.motto || 'Sem lema'}</p></div>
            <Button asChild variant="outline" className="border-white/[0.08]"><Link href="/club">Ver clube</Link></Button>
          </div>
        ) : <div className="mt-5 border-y border-white/[0.06] py-10 text-center"><Shield className="mx-auto h-8 w-8 text-primary/30" /><p className="mt-3 text-sm font-bold">Ainda não existe clube associado.</p><p className="mt-1 text-xs text-muted-foreground">O novo onboarding começa pela escolha do universo.</p></div>}
        <p className="mt-4 text-[11px] leading-5 text-muted-foreground">Foram removidos rank global inventado, divisão derivada de Elo, win-rate incorreto, challenge direto e amizade do schema antigo. Essas funcionalidades regressam com o modelo global + universe-scoped correto.</p>
      </section>
    </div>
  )
}

function IdentityBadge({ label }: { label: string }) { return <span className="rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{label}</span> }
function ProfileDomain({ icon: Icon, title, text }: { icon: typeof Award; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
