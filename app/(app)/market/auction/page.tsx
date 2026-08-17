import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Gavel, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { Button } from '@/components/ui/button'

export default async function AuctionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wallet } = await supabase.from('wallet').select('balance').eq('user_id', user.id).single()
  const legacyBalance = wallet?.balance || 0

  return (
    <div className="space-y-7">
      <Link href="/market" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar ao mercado</Link>

      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="clan-kicker">Leilões</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Licitação com escrow real, não saldo inventado.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">O maior bidder terá Silver reservado em escrow. No fecho, jogador, pagamento, fee e libertação de fundos serão processados numa única operação atómica.</p></div>
          <CurrencyDisplay kind="silver" amount={legacyBalance} label="Silver legado" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <AuctionRule icon={WalletCards} title="Escrow" text="Apenas Silver realmente reservado conta como licitação. Foi removido o antigo valor fictício de 15% do saldo." />
        <AuctionRule icon={Gavel} title="Fecho atómico" text="Winner, transferência do jogador, fee e pagamento ao vendedor acontecem juntos ou nada acontece." />
        <AuctionRule icon={ShieldCheck} title="Auditável" text="Bids, cancelamentos permitidos, expirations e settlement ficam associados ao universo e ao ledger." />
      </section>

      <section className="clan-panel-neutral flex min-h-[320px] flex-col items-center justify-center rounded-2xl p-8 text-center">
        <Gavel className="h-10 w-10 text-primary/45" />
        <h2 className="mt-4 text-xl font-black">Motor de leilões em migração</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">As ações do componente legado foram retiradas porque operavam sobre GameCoins e escrow simulado. A interface será ligada ao novo `UNIVERSE_PLAYER` + ledger Silver.</p>
        <Button className="mt-6" disabled><LockKeyhole className="mr-2 h-4 w-4" />Criar leilão</Button>
      </section>
    </div>
  )
}

function AuctionRule({ icon: Icon, title, text }: { icon: typeof Gavel; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
