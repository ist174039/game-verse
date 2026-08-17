import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, CupSoda, LockKeyhole, Swords, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Tournament } from '@/lib/types'

export default async function CompetitionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase.from('tournament').select('*').order('starts_at', { ascending: true }).limit(50)
  const legacyCompetitions = (data || []) as Tournament[]

  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="clan-kicker">Competições</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Liga, Taça, Torneios e Amigáveis.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">As competições pertencem ao universo, partilham o mesmo motor de partidas e só produzem efeitos depois do settlement validado.</p></div>
          <Button disabled><LockKeyhole className="mr-2 h-4 w-4" />Criar competição</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <CompetitionType icon={Trophy} title="Liga" detail="Divisões, classificação, promoção e descida." />
        <CompetitionType icon={CupSoda} title="Taça" detail="Knockout, uma ou duas mãos e final." />
        <CompetitionType icon={Swords} title="Torneio" detail="Grupos, eliminatória ou formatos especiais." />
        <CompetitionType icon={CalendarDays} title="Amigável" detail="Social, baixo impacto e sem farming económico." />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Registos existentes</p><h2 className="mt-1 text-xl font-black">Competições do schema legado</h2></div><Button variant="outline" asChild className="border-white/[0.08]"><Link href="/calendar">Ver calendário</Link></Button></div>
        <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {legacyCompetitions.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Não existem competições registadas.</p> : legacyCompetitions.map((competition) => (
            <div key={competition.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div className="min-w-0"><p className="truncate text-sm font-bold">{competition.name}</p><p className="mt-1 text-xs text-muted-foreground">{competition.format} · início {new Date(competition.starts_at).toLocaleDateString('pt-PT')}</p></div>
              <span className="w-fit rounded-md border border-white/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{competition.status}</span>
              <div className="text-left sm:text-right"><p className="text-sm font-black tabular-nums text-[var(--silver)]">{competition.prize_pool.toLocaleString('pt-PT')} S</p><p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">prize pool legado</p></div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-muted-foreground">Ações de inscrição, criação e pagamento do modelo antigo ficam fora desta página até serem migradas para competição + universo + ledger Silver.</p>
      </section>
    </div>
  )
}

function CompetitionType({ icon: Icon, title, detail }: { icon: typeof Trophy; title: string; detail: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary"><Icon className="h-4 w-4" /></div><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></article> }
