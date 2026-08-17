import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Gavel, ShieldCheck, WalletCards } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { AuctionClient } from '@/components/market/auction-client'

export default async function AuctionPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const requestedUniverseId = (await searchParams).universe
  const selected = (requestedUniverseId ? directory.entries.find(entry => entry.universe.id === requestedUniverseId && entry.club) : null) ?? directory.entries.find(entry => entry.club)
  if (!selected?.club) redirect('/onboarding')
  const market = await services.reads.market.load(user.id, selected.universe.id)
  if (!market) redirect('/onboarding')

  return (
    <div className="space-y-7">
      <Link href={`/market?universe=${market.universe.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar ao mercado</Link>
      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="clan-kicker">Leilões · {market.universe.name}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Escrow real. Concorrência transparente.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Cada licitação passa pelo ledger do universo. O maior bid mantém Silver reservado; quando é superado, o escrow anterior é libertado pela operação transacional.</p></div><CurrencyDisplay kind="silver" amount={market.silverBalance} label="Silver disponível" /></div>
      </section>
      <section className="grid gap-4 md:grid-cols-3"><Rule icon={WalletCards} title="Escrow" text="O maior bid mantém Silver reservado; o bid anterior é libertado de forma transacional." /><Rule icon={Gavel} title="Fecho atómico" text="Jogador, pagamento, fee e escrow são liquidados juntos ou a operação falha por inteiro." /><Rule icon={ShieldCheck} title="Auditável" text="Cada bid e settlement está associado à listagem, clube, universo e ledger." /></section>
      <section><div className="mb-4"><p className="text-sm font-semibold">Leilões ativos</p><p className="text-xs text-muted-foreground">{market.auctionListings.length} listagens</p></div><AuctionClient market={market} /></section>
    </div>
  )
}
function Rule({ icon: Icon, title, text }: { icon: typeof Gavel; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
