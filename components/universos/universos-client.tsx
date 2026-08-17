'use client'

import { Crown, Globe, LockKeyhole, Search, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UniversosClientProps { userId: string }

const policies = [
  ['PUBLIC', 'Entrada pública'],
  ['APPLICATION', 'Entrada por candidatura'],
  ['INVITE_ONLY', 'Apenas convite'],
  ['PRIVATE', 'Privado'],
]

export function UniversosClient({ userId: _userId }: UniversosClientProps) {
  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="clan-kicker">Universos</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Um clube por universo. Uma carreira sem fronteiras.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Cada universo isola clubes, Silver, jogadores, mercado, temporadas e competições. A identidade do manager continua global.</p></div>
          <Button disabled><LockKeyhole className="mr-2 h-4 w-4" />Criar universo</Button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <article className="overflow-hidden rounded-2xl border border-primary/18 bg-[radial-gradient(circle_at_80%_0%,rgba(245,191,22,.09),transparent_35%),#0b0b0b] p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.07] text-primary"><Crown className="h-6 w-6" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Universo oficial</p><h2 className="mt-1 text-2xl font-black">Universo Principal</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Governado pela plataforma, regras fixas, Liga Oficial, Taça do Clã, Supertaça, mercado e financiamento limitado.</p></div></div>
            <span className="w-fit rounded-md border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">PLATFORM OWNER</span>
          </div>
          <div className="mt-7 grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
            <UniverseDatum label="Economia" value="STANDARD" />
            <UniverseDatum label="Financiamento" value="LIMITED" />
            <UniverseDatum label="Temporadas" value="Sincronizadas" />
            <UniverseDatum label="Moderação" value="Plataforma" />
          </div>
        </article>

        <aside className="clan-panel-neutral rounded-2xl p-5">
          <div className="flex items-center gap-2"><Search className="h-4 w-4 text-primary" /><p className="text-sm font-bold">Explorar universos</p></div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">A descoberta real será alimentada pelo novo schema. Os universos fictícios que existiam nesta página foram removidos.</p>
          <div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input disabled placeholder="Nome, idioma, vagas, perfil económico…" className="pl-9" /></div>
          <div className="mt-4 flex flex-wrap gap-2">{['Público', 'Com vagas', 'Competitivo', 'Casual', 'PT'].map(tag => <span key={tag} className="rounded-md border border-white/[0.06] px-2 py-1 text-[10px] text-muted-foreground">{tag}</span>)}</div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <GovernanceBlock icon={Globe} title="Lifecycle" items={['DRAFT → CONFIGURING', 'OPEN_FOR_MEMBERS → ACTIVE', 'SEASON_RUNNING → SEASON_CLOSED', 'ARCHIVED / SUSPENDED']} />
        <GovernanceBlock icon={Users} title="Governance" items={['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']} />
        <GovernanceBlock icon={ShieldCheck} title="Entrada" items={policies.map(([code, label]) => `${code} · ${label}`)} />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Regra estrutural</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3"><Rule title="Utilizador" text="Identidade global, Gold, Bronze, Manager Level e reputação." /><Rule title="Universo" text="Contexto competitivo, regras, temporadas, mercado e governance." /><Rule title="Clube" text="Um por utilizador em cada universo, com Silver e património isolados." /></div>
      </section>
    </div>
  )
}

function UniverseDatum({ label, value }: { label: string; value: string }) { return <div className="bg-[#0b0b0b] p-3"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-bold text-foreground">{value}</p></div> }
function GovernanceBlock({ icon: Icon, title, items }: { icon: typeof Globe; title: string; items: string[] }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 text-lg font-black">{title}</h2><div className="mt-3 space-y-2">{items.map(item => <p key={item} className="text-xs leading-5 text-muted-foreground">{item}</p>)}</div></article> }
function Rule({ title, text }: { title: string; text: string }) { return <div className="border-t border-white/[0.07] pt-4"><p className="text-sm font-bold text-primary">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></div> }
