import { redirect } from 'next/navigation'
import { Banknote, CircleDollarSign, Gem, Landmark, ReceiptText, Scale, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { CurrencyDisplay } from '@/components/clan/currency-display'

export default async function EconomyPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const selected = (requestedUniverseId ? directory.entries.find(entry => entry.universe.id === requestedUniverseId && entry.club) : null) ?? directory.entries.find(entry => entry.club)
  if (!selected?.club) redirect('/onboarding')

  const economy = await services.reads.economy.load(user.id, selected.universe.id)
  if (!economy) redirect('/onboarding')

  const latestCycle = economy.cycles[0] ?? null
  const activeLoans = economy.loans.filter(loan => loan.state === 'ACTIVE' || loan.state === 'DEFAULTED')
  const openLiabilities = economy.liabilities.filter(item => item.state === 'OPEN' || item.state === 'PARTIALLY_PAID')
  const activeSponsors = economy.sponsorships.filter(item => item.state === 'ACTIVE')

  return <div className="space-y-7">
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <p className="clan-kicker">Economia · {economy.universe.name}</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Capital global e tesouraria do clube, sem misturar moedas.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Gold e Bronze pertencem ao manager. Silver pertence exclusivamente ao clube neste universo. Dívida, liabilities e resultados operacionais são apresentados separadamente do saldo disponível.</p>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      <CurrencyCard kind="gold" title="Gold" amount={economy.balances.gold} detail="Conta global do manager. Premium e financiamento controlado." />
      <CurrencyCard kind="silver" title="Silver" amount={economy.balances.silver} detail={`Tesouraria de ${economy.club.name}. Mercado, salários, manutenção e competição.`} />
      <CurrencyCard kind="bronze" title="Bronze" amount={economy.balances.bronze} detail="Conta global de engagement, achievements e colecionáveis." />
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={latestCycle && latestCycle.netResult >= 0 ? TrendingUp : TrendingDown} label="Último ciclo" value={latestCycle ? `${signed(latestCycle.netResult)} S` : '—'} detail={latestCycle?.cycleKey ?? 'Sem ciclo liquidado'} tone={latestCycle && latestCycle.netResult < 0 ? 'danger' : 'default'} />
      <Metric icon={Landmark} label="Capital em dívida" value={`${economy.totals.activeLoanPrincipal.toLocaleString('pt-PT')} S`} detail={`${activeLoans.length} empréstimo(s) ativo(s)`} />
      <Metric icon={Scale} label="Liabilities em aberto" value={`${economy.totals.openLiabilities.toLocaleString('pt-PT')} S`} detail={`${openLiabilities.length} obrigação(ões) não liquidadas`} tone={economy.totals.openLiabilities > 0 ? 'danger' : 'default'} />
      <Metric icon={CircleDollarSign} label="Patrocínio periódico" value={`${economy.totals.activeSponsorshipPeriodicIncome.toLocaleString('pt-PT')} S`} detail={`${activeSponsors.length} contrato(s) ativo(s)`} />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Ledger</p><h2 className="mt-1 text-xl font-black">Movimentos da tua economia</h2></div><ReceiptText className="h-5 w-5 text-primary" /></div>
        <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {economy.movements.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Ainda não existem movimentos nas contas deste manager/clube.</p> : economy.movements.map(movement => <div key={movement.entryId} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold">{movement.reason || movement.transactionType}</p><p className="mt-1 text-[10px] uppercase tracking-[0.11em] text-muted-foreground">{movement.transactionType} · {movement.scope} · {new Date(movement.createdAt).toLocaleString('pt-PT')}</p></div><p className={`text-sm font-black tabular-nums ${movement.direction === 'CREDIT' ? 'text-[var(--success)]' : 'text-destructive'}`}>{movement.direction === 'CREDIT' ? '+' : '-'}{movement.amount.toLocaleString('pt-PT')} {movement.currency}</p></div>)}
        </div>
      </div>

      <div className="space-y-4">
        <SummaryCard icon={Banknote} title="Último ciclo financeiro" rows={latestCycle ? [
          ['Folha salarial', `${latestCycle.payroll.toLocaleString('pt-PT')} S`],
          ['Manutenção', `${latestCycle.maintenance.toLocaleString('pt-PT')} S`],
          ['Custos de jogo', `${latestCycle.matchOperatingCost.toLocaleString('pt-PT')} S`],
          ['Patrocínios', `${latestCycle.sponsorshipIncome.toLocaleString('pt-PT')} S`],
          ['Receita de estádio', `${latestCycle.stadiumIncome.toLocaleString('pt-PT')} S`],
        ] : [['Estado', 'Sem ciclo liquidado']]} />
        <SummaryCard icon={ShieldCheck} title="Regras económicas" rows={[
          ['Financiamento', economy.universe.financingPolicy],
          ['Perfil', economy.universe.economicProfile],
          ['Taxa de mercado', `${economy.universe.marketFeePct}%`],
          ['Taxa de leilão', `${economy.universe.auctionFeePct}%`],
        ]} />
      </div>
    </section>
  </div>
}

function CurrencyCard({ kind, title, amount, detail }: { kind:'gold'|'silver'|'bronze'; title:string; amount:number; detail:string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><CurrencyDisplay kind={kind} amount={amount} /><h2 className="mt-5 text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p></article> }
function Metric({ icon:Icon, label, value, detail, tone='default' }: { icon:typeof Gem; label:string; value:string; detail:string; tone?:'default'|'danger' }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><Icon className={`h-4 w-4 ${tone === 'danger' ? 'text-destructive' : 'text-primary'}`} />{label}</div><p className={`mt-3 text-xl font-black tabular-nums ${tone === 'danger' ? 'text-destructive' : ''}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article> }
function SummaryCard({ icon:Icon, title, rows }: { icon:typeof Gem; title:string; rows:[string,string][] }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold">{title}</h3></div><div className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">{rows.map(([label,value]) => <div key={label} className="flex items-center justify-between gap-4 py-2.5"><span className="text-xs text-muted-foreground">{label}</span><span className="text-xs font-bold tabular-nums">{value}</span></div>)}</div></article> }
function signed(value:number) { return `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-PT')}` }
