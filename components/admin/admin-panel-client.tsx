'use client'

import {
  Activity,
  Banknote,
  Flag,
  Globe2,
  Landmark,
  LockKeyhole,
  ReceiptText,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Trophy,
  Users,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminPanelClientProps { role: string }

const domains = [
  { icon: Users, title: 'Utilizadores & Clubes', description: 'Identidade, roles, reputação, clubes, memberships e histórico.', href: null },
  { icon: Globe2, title: 'Universos', description: 'Governance, memberships, owners, temporadas e estado operacional.', href: null },
  { icon: Trophy, title: 'Universo Principal', description: 'Liga, Taça, Supertaça, calendário, janelas e settlement sazonal.', href: null },
  { icon: WalletCards, title: 'Economia', description: 'Gold, Silver, Bronze, ledger, grants, financing, loans e sinks.', href: null },
  { icon: Banknote, title: 'Stripe & Refunds', description: 'Pagamentos, reconciliação, refunds e estado dos webhooks.', href: null },
  { icon: ShieldAlert, title: 'Moderação & Fraude', description: 'Disputas, reports, freezing económico, sanções e appeals.', href: null },
  { icon: Flag, title: 'Backoffice', description: 'Tickets, suporte, operações e filas de trabalho.', href: '/admin/backoffice' },
  { icon: SlidersHorizontal, title: 'Configuração', description: 'Economia, competição, universo, segurança e feature flags.', href: null },
  { icon: ReceiptText, title: 'Audit Log', description: 'Todas as operações administrativas relevantes e irreversíveis.', href: null },
]

export function AdminPanelClient({ role }: AdminPanelClientProps) {
  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" /><p className="clan-kicker">Platform Control Center</p></div><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Administração global do Clã das Sombras.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Visão transversal, governance, suporte e intervenção controlada. Nenhuma operação sensível deve editar saldos, settlements ou estados diretamente.</p></div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Role ativa</p><p className="mt-1 text-sm font-black uppercase text-primary">{role.replaceAll('_', ' ')}</p></div>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
        <ControlMetric label="Estado" value="Operacional" icon={Activity} accent />
        <ControlMetric label="Economia" value="Ledger-first" icon={Landmark} />
        <ControlMetric label="Ações críticas" value="Auditadas" icon={LockKeyhole} />
        <ControlMetric label="Configuração" value="Versionada" icon={Settings} />
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Domínios de administração</p><h2 className="mt-1 text-xl font-black">Gestão global</h2></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {domains.map(({ icon: Icon, title, description, href }) => (
            <article key={title} className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 transition hover:border-primary/18">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] text-primary"><Icon className="h-4.5 w-4.5" /></div>
              <h3 className="mt-5 text-base font-black">{title}</h3><p className="mt-2 min-h-12 text-xs leading-5 text-muted-foreground">{description}</p>
              {href ? <Button asChild size="sm" variant="outline" className="mt-4 border-white/[0.08]"><a href={href}>Abrir módulo</a></Button> : <Button size="sm" variant="outline" disabled className="mt-4 border-white/[0.08]"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" />A ligar ao novo schema</Button>}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Policy title="Operações económicas" lines={['Grant → operação de ledger com reason/campaign.', 'Refund Stripe → refund real + reconciliação Gold.', 'Economic reversal → nunca editar transação anterior.', 'Freeze → user, club ou universe sem ban imediato.']} />
        <Policy title="Operações competitivas" lines={['Resultado confirmado → SETTLED uma única vez.', 'Alteração posterior → REVERSAL + NEW_SETTLEMENT.', 'Regras de época ficam locked durante SEASON_RUNNING.', 'Toda intervenção administrativa exige actor, reason e audit trail.']} />
      </section>
    </div>
  )
}

function ControlMetric({ label, value, icon: Icon, accent = false }: { label: string; value: string; icon: typeof Activity; accent?: boolean }) { return <div className="bg-[#0b0b0b] p-5"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><Icon className={`h-4 w-4 ${accent ? 'text-primary' : ''}`} />{label}</div><p className={`mt-3 text-xl font-black ${accent ? 'text-primary' : ''}`}>{value}</p></div> }
function Policy({ title, lines }: { title: string; lines: string[] }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><h3 className="font-black">{title}</h3><div className="mt-4 space-y-2">{lines.map(line => <div key={line} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />{line}</div>)}</div></article> }
