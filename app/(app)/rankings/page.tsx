import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Crown, Shield, Trophy, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const selected = (requestedUniverseId ? directory.entries.find(entry => entry.universe.id === requestedUniverseId && entry.club) : null) ?? directory.entries.find(entry => entry.club)
  if (!selected?.club) redirect('/onboarding')

  const rankings = await services.reads.rankings.load(user.id, selected.universe.id)
  if (!rankings) redirect('/onboarding')

  return <div className="space-y-7">
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <p className="clan-kicker">Ranking · {rankings.universe.name}</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Elo de clubes dentro do universo.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Não existe Elo global do utilizador. Cada clube compete no contexto económico e competitivo do seu universo.</p>
    </section>

    <section className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Trophy} label="Posição" value={rankings.viewerRank ? `#${rankings.viewerRank}` : '—'} />
      <Metric icon={Shield} label="Elo" value={rankings.viewerClub.elo.toLocaleString('pt-PT')} />
      <Metric icon={Crown} label="Prestígio" value={rankings.viewerClub.prestige.toLocaleString('pt-PT')} />
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Leaderboard</p><h2 className="mt-1 text-xl font-black">Top clubes</h2></div>
      <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {rankings.entries.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Ainda não existem clubes classificáveis neste universo.</p> : rankings.entries.map(entry => <div key={entry.club.id} className="grid gap-3 py-3 sm:grid-cols-[56px_1fr_auto] sm:items-center"><p className={`text-lg font-black tabular-nums ${entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>#{entry.rank}</p><div className="min-w-0"><Link href={`/profile/${entry.manager.id}`} className="inline-flex items-center gap-2 text-sm font-black hover:text-primary"><UserRound className="h-4 w-4" />{entry.club.name}</Link><p className="mt-1 text-xs text-muted-foreground">Manager {entry.manager.username} · Prestígio {entry.club.prestige.toLocaleString('pt-PT')} · {entry.club.fans.toLocaleString('pt-PT')} adeptos</p></div><p className="text-lg font-black tabular-nums">{entry.club.elo.toLocaleString('pt-PT')} <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Elo</span></p></div>)}
      </div>
    </section>
  </div>
}

function Metric({ icon:Icon, label, value }: { icon:typeof Trophy; label:string; value:string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div><p className="mt-3 text-2xl font-black tabular-nums">{value}</p></article> }
