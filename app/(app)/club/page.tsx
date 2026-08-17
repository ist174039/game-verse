import { redirect } from 'next/navigation'
import { Building2, CalendarDays, Crown, Dumbbell, GraduationCap, Landmark, LockKeyhole, Megaphone, Shield, Target, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import type { ClubInfrastructureReadModel } from '@/lib/application/read-models'

export default async function ClubPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const selected = (requestedUniverseId ? directory.entries.find(entry => entry.universe.id === requestedUniverseId && entry.club) : null) ?? directory.entries.find(entry => entry.club)
  if (!selected?.club) redirect('/onboarding')

  const overview = await services.reads.clubOverview.load(user.id, selected.universe.id)
  if (!overview) redirect('/onboarding')

  return <div className="space-y-7">
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-black/45">
            <img src={overview.club.logoUrl || '/brand/clan-logo.svg'} alt={`Emblema ${overview.club.name}`} className="h-full w-full object-contain p-2" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary"><Shield className="h-4 w-4" /><p className="clan-kicker">Clube · {overview.universe.name}</p></div>
            <h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em] sm:text-4xl">{overview.club.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{overview.club.motto || 'Clube ativo neste universo.'}</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Criado em {new Date(overview.club.createdAt).toLocaleDateString('pt-PT')} · Elo {overview.club.elo.toLocaleString('pt-PT')} · Prestígio {overview.club.prestige.toLocaleString('pt-PT')}</p>
          </div>
        </div>
        <CurrencyDisplay kind="silver" amount={overview.silverBalance} label="Tesouraria do clube" />
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric icon={CalendarDays} label="Jogos" value={overview.performance.played.toLocaleString('pt-PT')} />
      <Metric icon={Trophy} label="Vitórias" value={overview.performance.won.toLocaleString('pt-PT')} />
      <Metric icon={Target} label="Empates" value={overview.performance.drawn.toLocaleString('pt-PT')} />
      <Metric icon={Target} label="Derrotas" value={overview.performance.lost.toLocaleString('pt-PT')} />
      <Metric icon={Crown} label="Win rate" value={`${overview.performance.winRatePct}%`} />
      <Metric icon={Shield} label="Golos" value={`${overview.performance.goalsFor}-${overview.performance.goalsAgainst}`} />
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Infraestruturas</p><h2 className="mt-1 text-xl font-black">Capacidade operacional</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Os níveis e custos de manutenção vêm de `club_infrastructure`. Upgrades permanecem bloqueados até existir uma operação Silver atómica e auditável no ledger.</p></div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 text-primary" />Upgrades ainda não expostos</div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {INFRA_TYPES.map(type => <InfrastructureCard key={type} type={type} item={overview.infrastructure.find(item => item.type === type) ?? null} />)}
      </div>
    </section>
  </div>
}

const INFRA_TYPES: ClubInfrastructureReadModel['type'][] = ['STADIUM','ACADEMY','TRAINING','MARKETING','FINANCE']
const INFRA_CONFIG = {
  STADIUM: { name:'Estádio', icon:Building2, detail:'Receita de jogo, capacidade e experiência dos adeptos.' },
  ACADEMY: { name:'Academia', icon:GraduationCap, detail:'Desenvolvimento e acesso estruturado a talento.' },
  TRAINING: { name:'Centro de Treino', icon:Dumbbell, detail:'Preparação e capacidade operacional do plantel.' },
  MARKETING: { name:'Marketing', icon:Megaphone, detail:'Alcance, adeptos e valor comercial do clube.' },
  FINANCE: { name:'Finanças', icon:Landmark, detail:'Eficiência financeira e suporte à gestão de capital.' },
} satisfies Record<ClubInfrastructureReadModel['type'], { name:string; icon:typeof Building2; detail:string }>

function InfrastructureCard({ type, item }: { type: ClubInfrastructureReadModel['type']; item: ClubInfrastructureReadModel | null }) {
  const config = INFRA_CONFIG[type]
  const Icon = config.icon
  return <article className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary"><Icon className="h-4 w-4" /></div><span className="rounded-md border border-white/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Nível {item?.level ?? 0}</span></div><h3 className="mt-4 text-sm font-black">{config.name}</h3><p className="mt-2 min-h-12 text-xs leading-5 text-muted-foreground">{config.detail}</p><div className="mt-4 border-t border-white/[0.06] pt-3"><p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Manutenção</p><p className="mt-1 text-sm font-black tabular-nums text-[var(--silver)]">{item ? `${item.maintenanceCost.toLocaleString('pt-PT')} S` : '—'}</p></div></article>
}

function Metric({ icon:Icon, label, value }: { icon:typeof Trophy; label:string; value:string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div><p className="mt-3 text-xl font-black tabular-nums">{value}</p></article> }
