'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Clock3, Gavel, Info, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyDisplay } from '@/components/clan/currency-display'

interface AuctionPageClientProps {
  balance: number
  escrowAmount: number
}

export function AuctionPageClient({ balance }: AuctionPageClientProps) {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div className="space-y-7">
      <section className="brand-watermark overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="clan-kicker">Mercado · Leilões</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">Licitações com capital protegido.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              O novo leilão será liquidado em Silver, com escrow real, incremento mínimo e transferência atómica do jogador dentro do universo.
            </p>
          </div>

          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <CurrencyDisplay kind="silver" amount={balance} label="Silver legado" />
            <Button variant="outline" onClick={() => setInfoOpen(true)} className="w-full sm:w-auto">
              <Info className="h-4 w-4" /> Como funciona
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <AuctionMetric icon={WalletCards} label="Moeda" value="Silver" detail="Pertence ao clube e universo" />
        <AuctionMetric icon={LockKeyhole} label="Escrow" value="Atómico" detail="Capital retido apenas por operação real" />
        <AuctionMetric icon={ShieldCheck} label="Settlement" value="Auditável" detail="Sem edição direta de saldos ou ownership" accent />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="clan-panel-neutral flex min-h-[360px] flex-col items-center justify-center rounded-2xl p-6 text-center sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.055] text-primary">
            <Gavel className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-black">Leilões reais ainda não estão ativos</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Removemos o sistema mock que simulava jogadores, lances e escrow. A área só será reaberta quando estiver ligada ao novo schema de jogadores por universo e ao ledger Silver.
          </p>
          <div className="mt-6 grid w-full max-w-md gap-2 sm:grid-cols-2">
            <Button variant="outline" asChild><Link href="/market"><ArrowLeft className="h-4 w-4" />Voltar ao mercado</Link></Button>
            <Button disabled><LockKeyhole className="h-4 w-4" />Criar leilão</Button>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Fluxo previsto</p>
            <ol className="mt-4 space-y-4">
              <AuctionStep number="01" title="Listagem" detail="Clube escolhe jogador elegível, preço inicial, incremento e duração." />
              <AuctionStep number="02" title="Licitação" detail="Silver fica reservado em escrow; superar um lance liberta a reserva anterior." />
              <AuctionStep number="03" title="Fecho" detail="Winner, seller fee, ownership e ledger são processados numa operação atómica." />
            </ol>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-5">
            <div className="flex items-center gap-2 text-primary"><Clock3 className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.15em]">Sem estados simulados</span></div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Não mostramos countdowns, bidders ou saldos de escrow que não existam na base de dados real.</p>
          </div>
        </aside>
      </section>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como funcionará um leilão</DialogTitle>
            <DialogDescription>O fluxo foi desenhado para proteger capital, ownership e histórico económico.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <InfoRow title="Silver reservado" description="O clube precisa de saldo disponível. O valor comprometido fica em escrow e deixa de estar disponível para outras operações." />
            <InfoRow title="Auto-libertação" description="Quando um lance é superado, a reserva anterior é libertada de forma idempotente." />
            <InfoRow title="Fecho único" description="O settlement do leilão transfere jogador, paga vendedor, aplica taxa e encerra o escrow numa única transação." />
            <InfoRow title="Audit trail" description="Nenhum admin altera saldos manualmente; qualquer correção acontece por reversão ou adjustment auditado." />
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setInfoOpen(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AuctionMetric({ icon: Icon, label, value, detail, accent = false }: { icon: typeof Gavel; label: string; value: string; detail: string; accent?: boolean }) {
  return (
    <div className="border-t border-white/[0.08] px-1 py-4">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span></div>
      <p className={`mt-2 text-xl font-black ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function AuctionStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <li className="flex gap-3"><span className="pt-0.5 text-[10px] font-black tracking-[.12em] text-primary">{number}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></li>
}

function InfoRow({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>
}
