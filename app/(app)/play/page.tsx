import Link from 'next/link'
import { Gamepad2, LogIn, ShieldCheck, Swords, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { resolveOwnedUniverseContext, onboardingHref } from '@/lib/server/active-universe'
import { Button } from '@/components/ui/button'
import { CreateMatch } from '@/components/play/create-match'
import { MatchList } from '@/components/play/match-list'
import { redirect } from 'next/navigation'

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return <GuestCompetition />
  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const { selected, onboardingUniverseId } = resolveOwnedUniverseContext(directory.entries, requestedUniverseId)
  if (onboardingUniverseId) redirect(onboardingHref(onboardingUniverseId))
  if (!selected?.club) return <GuestCompetition signedIn />
  const hub = await services.reads.competitionHub.load(user.id, selected.universe.id)
  if (!hub) redirect(onboardingHref(selected.universe.id))

  return <div className="space-y-7"><CompetitionHeader universeName={hub.universe.name}/><section className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3"><StatusDatum icon={Trophy} label="Elo do clube" value={hub.club.elo.toLocaleString('pt-PT')} detail="Específico deste universo"/><StatusDatum icon={Gamepad2} label="Partidas" value={(hub.activeMatches.length+hub.completedMatches.length).toString()} detail={`${hub.activeMatches.length} ainda não liquidadas`}/><StatusDatum icon={ShieldCheck} label="Lifecycle final" value="SETTLED" detail="Só este estado produz consequências finais" accent/></section><div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"><CreateMatch universeName={hub.universe.name} eloRating={hub.club.elo} silverBalance={hub.silverBalance} competitionCount={hub.competitions.length}/><div className="space-y-6"><MatchList matches={hub.activeMatches} universeId={hub.universe.id} title="Partidas em curso" emptyMessage="Não existem partidas pendentes neste universo." icon="active"/><MatchList matches={hub.completedMatches} universeId={hub.universe.id} title="Histórico liquidado" emptyMessage="Ainda não existem partidas liquidadas." icon="history"/></div></div></div>
}
function CompetitionHeader({ universeName }: { universeName: string }) { return <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7"><p className="clan-kicker">Competição · {universeName}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Cada partida tem consequências.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Liga, Taça, torneios e eventos usam o mesmo lifecycle. Resultado, confirmação, disputa e settlement ficam auditáveis antes de afetarem Elo, classificação ou economia.</p></section> }
function GuestCompetition({ signedIn = false }: { signedIn?: boolean }) { return <div className="space-y-6"><CompetitionHeader universeName="Clã das Sombras"/><section className="clan-panel-neutral flex min-h-[420px] flex-col items-center justify-center rounded-2xl p-8 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.06] text-primary"><Swords className="h-7 w-7"/></div><h2 className="mt-5 text-2xl font-black">{signedIn?'Cria um clube para competir':'Entra para competir'}</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">A competição pertence ao clube dentro de um universo.</p><Button asChild className="mt-6"><Link href={signedIn?'/onboarding':'/auth/login'}><LogIn className="mr-2 h-4 w-4"/>{signedIn?'Criar clube':'Entrar / Registar'}</Link></Button></section></div> }
function StatusDatum({ icon: Icon, label, value, detail, accent = false }: { icon: typeof Trophy; label: string; value: string; detail: string; accent?: boolean }) { return <div className="bg-[#0b0b0b] p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"><Icon className={`h-4 w-4 ${accent?'text-primary':''}`}/>{label}</div><p className={`mt-3 text-2xl font-black ${accent?'text-primary':'text-foreground'}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div> }
