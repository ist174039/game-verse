'use client'

import Link from 'next/link'
import { ArrowLeft, LockKeyhole, ShieldAlert, Shirt, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TeamManagementClient() {
  return (
    <div className="space-y-7">
      <div><Link href="/club" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar ao clube</Link></div>

      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="clan-kicker">Plantel</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">O plantel é um ativo do clube.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Os jogadores são carregados de uma base externa, não evoluem artificialmente dentro da plataforma e só podem existir uma vez por universo.</p></div>
          <Button disabled><LockKeyhole className="mr-2 h-4 w-4" />Gerir onze</Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <RosterRule label="Plantel mínimo" value="18" detail="Configurável pelo universo dentro dos limites da plataforma." />
        <RosterRule label="Plantel máximo" value="25" detail="Evita acumulação excessiva e protege liquidez do mercado." />
        <RosterRule label="Titulares" value="11" detail="A formação submetida deve cumprir as regras da competição." accent />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="clan-panel-neutral rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Jogadores do clube</p><h2 className="mt-1 text-xl font-black">Aguardando Universe Player assets</h2></div><Shirt className="h-5 w-5 text-primary" /></div>
          <div className="mt-6 flex min-h-[340px] flex-col items-center justify-center border-y border-white/[0.06] px-6 text-center">
            <Users className="h-10 w-10 text-primary/35" />
            <p className="mt-4 text-sm font-bold">Os jogadores fictícios foram removidos.</p>
            <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">O antigo ecrã usava um onze hardcoded com ratings inventados. O novo plantel será preenchido exclusivamente a partir de PLAYER_MASTER + UNIVERSE_PLAYER quando o schema definitivo estiver ativo.</p>
          </div>
        </div>

        <div className="space-y-4">
          <RosterPolicy icon={Shirt} title="Rating externo" text="Overall e atributos vêm do provider. Atualizações recalculam valor de referência e salário, não XP interno." />
          <RosterPolicy icon={ShieldAlert} title="Disponibilidade" text="ACTIVE, RESERVE, LISTED, AUCTION e UNAVAILABLE determinam se um jogador pode ser escalado." />
          <RosterPolicy icon={LockKeyhole} title="Formação" text="Configurar o onze é operacional. Não altera o resultado do jogo externo nem cria buffs escondidos." />
        </div>
      </section>
    </div>
  )
}

function RosterRule({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) { return <article className="border-t border-white/[0.08] px-1 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className={`mt-1 text-3xl font-black ${accent ? 'text-primary' : ''}`}>{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></article> }
function RosterPolicy({ icon: Icon, title, text }: { icon: typeof Shirt; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><p className="text-sm font-black">{title}</p></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
