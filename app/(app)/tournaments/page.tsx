import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, CupSoda, LockKeyhole, Swords, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { Button } from '@/components/ui/button'

export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const selected = (requestedUniverseId ? directory.entries.find(entry => entry.universe.id === requestedUniverseId && entry.club) : null) ?? directory.entries.find(entry => entry.club)
  if (!selected?.club) redirect('/onboarding')
  const hub = await services.reads.competitionHub.load(user.id, selected.universe.id)
  if (!hub) redirect('/onboarding')

  return <div className="space-y-7">
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7"><div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="clan-kicker">Competições · {hub.universe.name}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Liga, Taça, Torneios e Amigáveis.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Cada competição pertence ao universo e partilha o mesmo motor de partida, settlement, classificação e ledger.</p></div><Button disabled className="w-full lg:w-auto"><LockKeyhole className="h-4 w-4" />Criação governada</Button></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><CompetitionType icon={Trophy} title="Liga" detail="Classificação e jornadas sobre league_standing." /><CompetitionType icon={CupSoda} title="Taça" detail="Rounds e progressão knockout." /><CompetitionType icon={Swords} title="Torneio" detail="Formato definido nas rules da competição." /><CompetitionType icon={CalendarDays} title="Amigável" detail="Evento competitivo sem inventar economia paralela." /></section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Motor competitivo</p><h2 className="mt-1 text-xl font-black">Competições deste universo</h2></div><Button variant="outline" asChild className="w-full border-white/[0.08] sm:w-auto"><Link href={`/play?universe=${hub.universe.id}`}><Swords className="h-4 w-4" />Ver partidas</Link></Button></div>
      <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {hub.competitions.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Não existem competições ativas ou configuradas neste universo.</p> : hub.competitions.map(competition => <div key={competition.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold">{competition.name}</p><span className="rounded-md border border-primary/12 bg-primary/[0.035] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-primary">{competition.type}</span></div><p className="mt-1 text-xs text-muted-foreground">{competition.seasonId ? 'Associada a época' : 'Sem época associada'} · criada {new Date(competition.createdAt).toLocaleDateString('pt-PT')}</p></div><span className="w-fit rounded-md border border-white/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{competition.status}</span><div className="text-left sm:text-right"><p className="text-sm font-black tabular-nums text-[var(--silver)]">{competition.prizePool.toLocaleString('pt-PT')} S</p><p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">prize pool</p></div></div>)}
      </div>
      <p className="mt-4 text-[11px] leading-5 text-muted-foreground">A antiga tabela tournament deixou de ser a fonte desta página. Inscrição, rounds e detalhe serão ligados diretamente a competition_participant, competition_round e league_standing.</p>
    </section>
  </div>
}

function CompetitionType({ icon: Icon, title, detail }: { icon: typeof Trophy; title: string; detail: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary"><Icon className="h-4 w-4" /></div><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></article> }
