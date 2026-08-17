import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Check, Gem, LockKeyhole, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function BuyGoldPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link href="/economy" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar à economia</Link>

      <section className="brand-watermark rounded-2xl border border-primary/15 bg-[#0b0b0b] px-5 py-8 text-center sm:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.07] text-primary shadow-[0_0_40px_rgba(245,191,22,.08)]"><Gem className="h-7 w-7" /></div>
        <p className="clan-kicker mt-5">Gold</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">A moeda premium da plataforma.</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Gold será adquirido através do Stripe e usado em produtos conhecidos: premium, criação de universos, branding, passes e financiamento controlado. O antigo fluxo de compra de GameCoins foi desativado.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <GoldUse title="Premium" points={['Season Pass', 'Cosméticos premium', 'Branding avançado']} />
        <GoldUse title="Universos" points={['Criação de universo', 'Expansões permitidas', 'Serviços de organização']} />
        <GoldUse title="Financiamento" points={['Produtos controlados', 'Limite por universo', 'Silver entra no clube']} />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Stripe preparado</p></div><h2 className="mt-2 text-xl font-black">Pacotes ainda não publicados</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">O produto Stripe “Clã das Sombras — Gold” já foi criado em test mode. Os preços ficam bloqueados até fecharmos os pacotes e a reconciliação Gold/Refund no novo ledger.</p></div>
          <Button disabled className="shrink-0"><LockKeyhole className="mr-2 h-4 w-4" />Comprar Gold</Button>
        </div>
      </section>
    </div>
  )
}

function GoldUse({ title, points }: { title: string; points: string[] }) {
  return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><p className="text-lg font-black text-primary">{title}</p><div className="mt-4 space-y-2">{points.map((point) => <div key={point} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-3.5 w-3.5 text-primary" />{point}</div>)}</div></article>
}
