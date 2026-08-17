import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Banknote, Gem, Landmark, LockKeyhole, ReceiptText, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { Button } from '@/components/ui/button'

export default async function EconomyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [walletResult, transactionsResult] = await Promise.all([
    supabase.from('wallet').select('*').eq('user_id', user.id).single(),
    supabase.from('coin_transaction').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
  ])

  const legacyBalance = walletResult.data?.balance || 0
  const transactions = transactionsResult.data || []

  return (
    <div className="space-y-7">
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="clan-kicker">Economia</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Capital, liquidez e progressão sem confusão.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Gold pertence ao utilizador, Silver pertence ao clube dentro de cada universo e Bronze recompensa engagement. Cada moeda tem origem, destino e ledger próprios.</p></div>
          <Button asChild><Link href="/economy/buy"><Gem className="mr-2 h-4 w-4" />Área Gold <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <EconomyCurrency kind="gold" title="Gold" description="Premium, criação de universos, passes e operações de financiamento controladas." note="Nunca pertence ao clube." />
        <EconomyCurrency kind="silver" title="Silver" amount={legacyBalance} description="Tesouraria do clube: mercado, salários, manutenção, crédito e receitas." note="Saldo mostrado é temporariamente o wallet legado." />
        <EconomyCurrency kind="bronze" title="Bronze" description="Engagement, achievements, cosméticos e colecionáveis." note="Não converte para Gold ou Silver." />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="clan-panel-neutral rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Ledger económico</p><h2 className="mt-1 text-xl font-black">Movimentos recentes</h2></div><ReceiptText className="h-5 w-5 text-primary" /></div>
          <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {transactions.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Ainda não existem movimentos legados.</p> : transactions.map((tx) => <div key={tx.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{tx.description || tx.source_type}</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{new Date(tx.created_at).toLocaleString('pt-PT')} · legado</p></div><p className={`shrink-0 text-sm font-black tabular-nums ${tx.type === 'credit' ? 'text-[var(--success)]' : 'text-destructive'}`}>{tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString('pt-PT')} <span className="text-[9px] text-muted-foreground">legacy</span></p></div>)}
          </div>
        </div>

        <div className="space-y-4">
          <EconomyRule icon={Landmark} title="Financiamento" description="Gold compra produtos de financiamento; o produto injeta Silver dentro dos limites do universo. Não existe câmbio livre Gold → Silver." />
          <EconomyRule icon={Banknote} title="Silver sinks" description="Salários, manutenção, taxas de mercado, juros e inscrições retiram Silver de circulação e controlam inflação." />
          <EconomyRule icon={LockKeyhole} title="Sem edição direta" description="Refunds, grants e correções administrativas serão operações explícitas no ledger, sempre auditadas." />
        </div>
      </section>
    </div>
  )
}

function EconomyCurrency({ kind, title, amount = 0, description, note }: { kind: 'gold' | 'silver' | 'bronze'; title: string; amount?: number; description: string; note: string }) {
  return <article className={`rounded-2xl border p-5 ${kind === 'gold' ? 'border-primary/18 bg-primary/[0.035]' : 'border-white/[0.07] bg-[#0b0b0b]'}`}><CurrencyDisplay kind={kind} amount={amount} /><h2 className="mt-5 text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">{note}</p></article>
}

function EconomyRule({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><p className="text-sm font-bold">{title}</p></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p></div>
}
