import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check, CircleCheck, Gem, Info, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { GoldCheckoutClient } from '@/components/economy/gold-checkout-client'

export const dynamic = 'force-dynamic'

export default async function BuyGoldPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const catalog = await services.reads.goldCatalog.load(user.id)
  const payment = (await searchParams).payment
  const checkoutEnabled = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <Link href="/economy" className="inline-flex items-center text-sm font-semibold text-muted-foreground transition hover:text-foreground">Voltar à economia</Link>

      {payment === 'success' && <StatusBanner success title="Pagamento recebido" detail="O Stripe confirmou o regresso ao Clã. O saldo é atualizado pelo webhook; se ainda não mudou, atualiza a página dentro de alguns segundos." />}
      {payment === 'cancelled' && <StatusBanner title="Pagamento cancelado" detail="Nenhum Gold foi creditado e não foi criada qualquer cobrança concluída. Podes escolher outro pacote quando quiseres." />}

      <section className="brand-watermark rounded-2xl border border-primary/15 bg-[#0b0b0b] px-5 py-8 text-center sm:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.07] text-primary"><Gem className="h-7 w-7" /></div>
        <p className="clan-kicker mt-5">Gold</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Escolhe o teu pacote Gold.</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">O pagamento é processado pelo Stripe. O browser nunca altera saldos: apenas o webhook validado pode creditar Gold na conta global do manager.</p>
        <div className="mx-auto mt-5 w-fit rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Saldo atual</p><p className="mt-1 text-2xl font-black text-primary">{catalog.balance.toLocaleString('pt-PT')} Gold</p></div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <GoldUse title="Conta global" points={['Gold pertence ao manager', 'Pode apoiar qualquer clube elegível', 'Movimentos ficam no ledger']} />
        <GoldUse title="Checkout seguro" points={['Preço validado no servidor', 'Pagamento alojado pelo Stripe', 'Webhook e idempotência']} />
        <GoldUse title="Compra responsável" points={['Gold não é convertido automaticamente', 'A conversão para Silver tem limite semanal', 'Refunds sujeitos a reconciliação']} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Catálogo Gold</p><h2 className="text-xl font-black">Pacotes disponíveis</h2></div></div>
        {!checkoutEnabled && <StatusBanner title="Pagamento temporariamente indisponível" detail="O catálogo está preparado, mas a configuração Stripe de produção ainda não está completa. As compras permanecem bloqueadas para evitar cobranças sem crédito de Gold." />}
        <GoldCheckoutClient packages={catalog.packages} checkoutEnabled={checkoutEnabled} />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Histórico de pagamentos</p>
        <div className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {catalog.recentOrders.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Ainda não existem ordens de pagamento.</p> : catalog.recentOrders.map(order => <div key={order.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-semibold">{order.goldAmount.toLocaleString('pt-PT')} Gold</p><p className="mt-1 text-[10px] uppercase tracking-[0.11em] text-muted-foreground">{new Date(order.createdAt).toLocaleString('pt-PT')} · Stripe</p></div><span className="w-fit rounded-md border border-white/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{order.status}</span><p className="text-sm font-black">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: order.fiatCurrency.toUpperCase() }).format(order.amountCents / 100)}</p></div>)}
        </div>
      </section>
    </div>
  )
}

function GoldUse({ title, points }: { title: string; points: string[] }) {
  return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><p className="text-lg font-black text-primary">{title}</p><div className="mt-4 space-y-2">{points.map(point => <div key={point} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-3.5 w-3.5 text-primary" />{point}</div>)}</div></article>
}

function StatusBanner({ success = false, title, detail }: { success?: boolean; title: string; detail: string }) {
  const Icon = success ? CircleCheck : Info
  return <section className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${success ? 'border-emerald-500/20 bg-emerald-500/[.06]' : 'border-primary/15 bg-primary/[.04]'}`}><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${success ? 'text-emerald-400' : 'text-primary'}`} /><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></section>
}
