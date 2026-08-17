'use client'

import { CalendarClock, LockKeyhole, ShieldCheck, Swords, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateMatchProps {
  userId: string
  eloRating: number
  balance: number
}

export function CreateMatch({ eloRating, balance }: CreateMatchProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
      <div className="border-b border-white/[0.06] bg-[radial-gradient(circle_at_top_right,rgba(245,191,22,.09),transparent_38%)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.07] text-primary"><Swords className="h-5 w-5" /></div>
          <div><p className="clan-kicker">Preparar partida</p><h2 className="mt-1 text-xl font-black tracking-[-0.025em]">Competição controlada</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A criação direta de partidas do modelo antigo foi desativada. O novo fluxo será criado no contexto do universo, competição ou matchmaking casual.</p></div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <ContextDatum label="Elo legado" value={eloRating.toLocaleString('pt-PT')} />
          <ContextDatum label="Silver legado" value={balance.toLocaleString('pt-PT')} />
        </div>

        <div className="space-y-2 border-y border-white/[0.06] py-4">
          <FlowItem icon={CalendarClock} title="Agendamento" detail="Jornada, Taça, Torneio ou Casual." />
          <FlowItem icon={ShieldCheck} title="Resultado validado" detail="Screenshot, confirmação ou disputa." />
          <FlowItem icon={Trophy} title="Settlement único" detail="Elo, classificação e economia só depois de SETTLED." />
        </div>

        <Button className="w-full" disabled><LockKeyhole className="mr-2 h-4 w-4" />Disponível com o novo motor de partidas</Button>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">Foram removidos os antigos prémios fixos em GameCoins e o matchmaking aleatório sem regras de universo.</p>
      </div>
    </section>
  )
}

function ContextDatum({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-3"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-black tabular-nums">{value}</p></div>
}

function FlowItem({ icon: Icon, title, detail }: { icon: typeof Swords; title: string; detail: string }) {
  return <div className="flex gap-3 py-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></div>
}
