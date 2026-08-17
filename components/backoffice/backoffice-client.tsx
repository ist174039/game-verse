'use client'

import { AlertTriangle, Banknote, Headphones, LockKeyhole, ReceiptText, ShieldAlert, Tickets, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const queues = [
  { icon: Tickets, title: 'Tickets', detail: 'PAYMENT · ECONOMY · MATCH · MARKET · ACCOUNT · UNIVERSE · MODERATION · TECHNICAL' },
  { icon: ShieldAlert, title: 'Disputas & Moderação', detail: 'Resultados, reports, sanções, appeals e evidência associada ao caso.' },
  { icon: Banknote, title: 'Refunds & Grants', detail: 'Stripe refund, reconciliação Gold, economic reversal e compensações auditadas.' },
  { icon: Headphones, title: 'Suporte', detail: 'Contexto do utilizador, clube e universo sem edição manual de dados sensíveis.' },
]

export function BackofficeClient() {
  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" /><p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Operações internas</p></div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Backoffice operacional.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Filas de trabalho para suporte, moderação, pagamentos e incidentes. Foram removidos utilizadores, saldos, receitas e KPIs fictícios do ecrã anterior.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {queues.map(({ icon: Icon, title, detail }) => <article key={title} className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p><Button variant="outline" size="sm" disabled className="mt-4 border-white/[0.08]"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" />A ligar ao schema</Button></article>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="clan-panel-neutral rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Fila atual</p><h2 className="mt-1 text-xl font-black">Sem casos fabricados</h2></div><Tickets className="h-5 w-5 text-primary" /></div>
          <div className="mt-6 flex min-h-[300px] flex-col items-center justify-center border-y border-white/[0.06] p-8 text-center"><ReceiptText className="h-9 w-9 text-primary/35" /><p className="mt-4 text-sm font-bold">Os casos virão do domínio de suporte real.</p><p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">Cada ticket poderá referenciar user, club, universe, payment, match ou market transaction e encadear ações autorizadas com reason obrigatório.</p></div>
        </div>

        <div className="rounded-2xl border border-destructive/15 bg-destructive/[0.025] p-5">
          <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Regra de segurança</p></div>
          <h2 className="mt-3 text-lg font-black">Backoffice não é um editor de base de dados.</h2>
          <div className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground"><p>• Grant cria transação de ledger.</p><p>• Refund real passa pelo Stripe e depois por reconciliação.</p><p>• Resultado corrigido cria reversal + new settlement.</p><p>• Freeze económico bloqueia operações sem destruir histórico.</p><p>• Todas as ações relevantes entram no `admin_audit_log`.</p></div>
        </div>
      </section>
    </div>
  )
}
