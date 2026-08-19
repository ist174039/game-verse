import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CircleDollarSign, Gem, Landmark, ReceiptText, Scale, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { FinanceClubClient } from '@/components/economy/finance-club-client'
import { LoanOperationsClient } from '@/components/economy/loan-operations-client'
import { SponsorshipOperationsClient } from '@/components/economy/sponsorship-operations-client'
import { LiabilityOperationsClient } from '@/components/economy/liability-operations-client'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function EconomyPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requested = (await searchParams).universe
  const selected = (requested ? directory.entries.find(entry => entry.universe.id === requested && entry.club) : null) ?? directory.entries.find(entry => entry.club)
  if (!selected?.club) redirect('/onboarding')

  const economy = await services.reads.economy.load(user.id, selected.universe.id)
  if (!economy) redirect('/onboarding')

  const configResult = await supabase.rpc('get_gameplay_config', { p_key: 'economy.loan_defaults' })
  if (configResult.error) throw configResult.error
  const config = (configResult.data ?? {}) as Record<string, unknown>
  const loanConfig = {
    enabled: Boolean(config.enabled ?? false),
    minPrincipal: Number(config.min_principal ?? 10000),
    maxPrincipal: Number(config.max_principal ?? 500000),
    interestRatePct: Number(config.interest_rate_pct ?? 6),
    installments: Number(config.installments ?? 5),
  }

  const latest = economy.cycles[0] ?? null
  const activeLoans = economy.loans.filter(loan => loan.state === 'ACTIVE' || loan.state === 'DEFAULTED')
  const liabilities = economy.liabilities.filter(liability => liability.state === 'OPEN' || liability.state === 'PARTIALLY_PAID')
  const sponsors = economy.sponsorships.filter(contract => contract.state === 'ACTIVE')

  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="clan-kicker">Economia · {economy.universe.name}</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Capital global e tesouraria do clube.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Gold e Bronze pertencem ao manager. Silver pertence ao clube. Patrocínios, dívida, partidas e custos recorrentes passam pelo ledger e pelos ciclos financeiros.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/rewards">Recompensas Bronze</Link></Button><Button asChild><Link href="/economy/buy"><Gem className="mr-2 h-4 w-4" />Comprar Gold</Link></Button></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <CurrencyCard kind="gold" title="Gold" amount={economy.balances.gold} detail="Premium global e financiamento controlado." />
        <CurrencyCard kind="silver" title="Silver" amount={economy.balances.silver} detail={`Tesouraria de ${economy.club.name}.`} />
        <CurrencyCard kind="bronze" title="Bronze" amount={economy.balances.bronze} detail="Engagement, conquistas e colecionáveis." />
      </section>

      <FinanceClubClient clubId={economy.club.id} clubName={economy.club.name} goldBalance={economy.balances.gold} financingPolicy={economy.universe.financingPolicy} />
      <SponsorshipOperationsClient clubId={economy.club.id} contracts={economy.sponsorships} />
      <LoanOperationsClient clubId={economy.club.id} silverBalance={economy.balances.silver} loans={economy.loans} config={loanConfig} />
      <LiabilityOperationsClient liabilities={economy.liabilities} silverBalance={economy.balances.silver} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={latest && latest.netResult >= 0 ? TrendingUp : TrendingDown} label="Último ciclo" value={latest ? `${signed(latest.netResult)} S` : '—'} detail={latest?.cycleKey ?? 'Sem ciclo liquidado'} danger={Boolean(latest && latest.netResult < 0)} />
        <Metric icon={Landmark} label="Capital em dívida" value={`${economy.totals.activeLoanPrincipal.toLocaleString('pt-PT')} S`} detail={`${activeLoans.length} empréstimo(s)`} />
        <Metric icon={Scale} label="Liabilities" value={`${economy.totals.openLiabilities.toLocaleString('pt-PT')} S`} detail={`${liabilities.length} em aberto`} danger={economy.totals.openLiabilities > 0} />
        <Metric icon={CircleDollarSign} label="Patrocínio periódico" value={`${economy.totals.activeSponsorshipPeriodicIncome.toLocaleString('pt-PT')} S`} detail={`${sponsors.length} contrato(s)`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
          <div className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /><h2 className="text-xl font-black">Movimentos do ledger</h2></div>
          <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {economy.movements.length === 0 ? <Empty /> : economy.movements.map(movement => (
              <div key={movement.entryId} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><p className="truncate text-sm font-semibold">{movement.reason || movement.transactionType}</p><p className="mt-1 text-[10px] uppercase tracking-[.11em] text-muted-foreground">{movement.transactionType} · {movement.scope} · {new Date(movement.createdAt).toLocaleString('pt-PT')}</p></div>
                <p className={`text-sm font-black tabular-nums ${movement.direction === 'CREDIT' ? 'text-[var(--success)]' : 'text-destructive'}`}>{movement.direction === 'CREDIT' ? '+' : '-'}{movement.amount.toLocaleString('pt-PT')} {movement.currency}</p>
              </div>
            ))}
          </div>
        </article>
        <div className="space-y-4">
          <Summary title="Último ciclo" rows={latest ? [['Payroll', `${latest.payroll.toLocaleString('pt-PT')} S`], ['Manutenção', `${latest.maintenance.toLocaleString('pt-PT')} S`], ['Custos de jogo', `${latest.matchOperatingCost.toLocaleString('pt-PT')} S`], ['Patrocínios', `${latest.sponsorshipIncome.toLocaleString('pt-PT')} S`], ['Estádio', `${latest.stadiumIncome.toLocaleString('pt-PT')} S`]] : [['Estado', 'Sem ciclo']]} />
          <Summary title="Regras" rows={[['Financiamento', economy.universe.financingPolicy], ['Perfil', economy.universe.economicProfile], ['Mercado', `${economy.universe.marketFeePct}%`], ['Leilão', `${economy.universe.auctionFeePct}%`]]} />
        </div>
      </section>
    </div>
  )
}

function CurrencyCard({ kind, title, amount, detail }: { kind: 'gold' | 'silver' | 'bronze'; title: string; amount: number; detail: string }) {
  return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><CurrencyDisplay kind={kind} amount={amount} /><h2 className="mt-5 text-lg font-black">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{detail}</p></article>
}

function Metric({ icon: Icon, label, value, detail, danger = false }: { icon: typeof Gem; label: string; value: string; detail: string; danger?: boolean }) {
  return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className={`h-4 w-4 ${danger ? 'text-destructive' : 'text-primary'}`} /><p className={`mt-3 text-xl font-black ${danger ? 'text-destructive' : ''}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{label} · {detail}</p></article>
}

function Summary({ title, rows }: { title: string; rows: [string, string][] }) {
  return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold">{title}</h3></div><div className="mt-4 divide-y divide-white/[0.06]">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-2.5 text-xs"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}</span></div>)}</div></article>
}

function signed(value: number) { return `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-PT')}` }
function Empty() { return <p className="py-10 text-center text-sm text-muted-foreground">Ainda não existem movimentos.</p> }
