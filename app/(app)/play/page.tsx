import Link from 'next/link'
import { Gamepad2, LogIn, ShieldCheck, Swords, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CreateMatch } from '@/components/play/create-match'
import { MatchList } from '@/components/play/match-list'
import type { MatchWithPlayers } from '@/lib/types'

export default async function PlayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isGuest = user?.is_anonymous || false

  if (!user || isGuest) {
    return (
      <div className="space-y-6">
        <CompetitionHeader />
        <section className="clan-panel-neutral flex min-h-[420px] flex-col items-center justify-center rounded-2xl p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.06] text-primary"><Swords className="h-7 w-7" /></div>
          <h2 className="mt-5 text-2xl font-black">Entra para competir</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">A competição está ligada à tua identidade, clube e universo. Inicia sessão para veres jornadas, desafios e resultados.</p>
          <Button asChild className="mt-6"><Link href="/auth/login"><LogIn className="mr-2 h-4 w-4" />Entrar / Registar</Link></Button>
        </section>
      </div>
    )
  }

  const [profileResult, walletResult, matchesResult] = await Promise.all([
    supabase.from('user_profile').select('*').eq('id', user.id).single(),
    supabase.from('wallet').select('*').eq('user_id', user.id).single(),
    supabase.from('match').select('*, creator:creator_id(id, username, avatar_url, elo_rating), opponent:opponent_id(id, username, avatar_url, elo_rating)').or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(20),
  ])

  const profile = profileResult.data
  const wallet = walletResult.data
  const matches = (matchesResult.data || []) as unknown as MatchWithPlayers[]
  const completedStates = ['ECONOMY_UPDATE', 'RANKING_UPDATE']
  const activeMatches = matches.filter((match) => !completedStates.includes(match.state))
  const completedMatches = matches.filter((match) => completedStates.includes(match.state))

  return (
    <div className="space-y-7">
      <CompetitionHeader />

      <section className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
        <StatusDatum icon={Trophy} label="Elo legado" value={(profile?.elo_rating || 1200).toLocaleString('pt-PT')} detail="Será migrado para clube + universo" />
        <StatusDatum icon={Gamepad2} label="Partidas registadas" value={matches.length.toString()} detail="Histórico atualmente disponível" />
        <StatusDatum icon={ShieldCheck} label="Novo lifecycle" value="SETTLED" detail="Único estado que produz consequências" accent />
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <CreateMatch userId={user.id} eloRating={profile?.elo_rating || 1200} balance={wallet?.balance || 0} />
        <div className="space-y-6">
          <MatchList matches={activeMatches} userId={user.id} title="Partidas em curso" emptyMessage="Não existem partidas pendentes no modelo atual." icon="active" />
          <MatchList matches={completedMatches} userId={user.id} title="Histórico" emptyMessage="Ainda não existem partidas concluídas." icon="history" />
        </div>
      </div>
    </div>
  )
}

function CompetitionHeader() {
  return (
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <p className="clan-kicker">Competição</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Cada partida tem consequências.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Liga, Taça, torneios e casual usam o mesmo motor de partida. Resultado, disputa e settlement ficam auditáveis antes de afetarem Elo, classificação ou economia.</p>
    </section>
  )
}

function StatusDatum({ icon: Icon, label, value, detail, accent = false }: { icon: typeof Trophy; label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="bg-[#0b0b0b] p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"><Icon className={`h-4 w-4 ${accent ? 'text-primary' : ''}`} />{label}</div><p className={`mt-3 text-2xl font-black ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}
