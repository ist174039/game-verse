import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Check, Gem, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { GoldCheckoutClient } from '@/components/economy/gold-checkout-client'

export default async function BuyGoldPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const catalog = await services.reads.goldCatalog.load(user.id)

  return <div className="mx-auto max-w-5xl space-y-7">
    <Link href="/economy" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar à economia</Link>

    <section className="brand-watermark rounded-2xl border border-primary/15 bg-[#0b0b0b] px-5 py-8 text-center sm:px-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.07] text-primary"><Gem className="h-7 w-7" /></div>
      <p className="clan-kicker mt-5">Gold</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Compra premium com settlement em ledger.</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">O Stripe processa o pagamento fiat; só um webhook validado credita Gold na conta global do manager. Nenhum saldo é alterado pelo browser.</p>
      <div className="mx-auto mt-5 w-fit rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Saldo atual</p><p className="mt-1 text-2xl font-black text-primary">{catalog.balance.toLocaleString('pt-PT')} Gold</p></div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      <GoldUse title="Conta global" points={['Gold pertence ao manager', 'Não é saldo de clube', 'Movimentos ficam no ledger']} />
      <GoldUse title="Checkout seguro" points={['Pacote validado no servidor', 'Stripe Checkout', 'Webhook assinado']} />
      <GoldUse title="Refunds" points={['Estado auditável', 'Sem clawback cego', 'Reconciliação quando necessário']} />
    </section>

    <section className="space-y-4">
      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Catálogo Gold</p><h2 className="text-xl font-black">Pacotes ativos</h2></div></div>
      <GoldCheckoutClient packages={catalog.packages} />
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Histórico de pagamentos</p>
      <div className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {catalog.recentOrders.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Ainda não existem ordens de pagamento.</p> : catalog.recentOrders.map(order => <div key={order.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-semibold">{order.goldAmount.toLocaleString('pt-PT')} Gold</p><p className="mt-1 text-[10px] uppercase tracking-[0.11em] text-muted-foreground">{new Date(order.createdAt).toLocaleString('pt-PT')} · Stripe</p></div><span className="w-fit rounded-md border border-white/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{order.status}</span><p className="text-sm font-black">{new Intl.NumberFormat('pt-PT',{style:'currency',currency:order.fiatCurrency.toUpperCase()}).format(order.amountCents/100)}</p></div>)}
      </div>
    </section>
  </div>
}

function GoldUse({ title, points }: { title:string; points:string[] }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><p className="text-lg font-black text-primary">{title}</p><div className="mt-4 space-y-2">{points.map(point => <div key={point} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-3.5 w-3.5 text-primary" />{point}</div>)}</div></article> }
