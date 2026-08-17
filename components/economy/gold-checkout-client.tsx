'use client'

import { useState } from 'react'
import { Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startGoldCheckout } from '@/app/actions/stripe'
import type { GoldPackage } from '@/lib/domain/payments'

export function GoldCheckoutClient({ packages }: { packages: GoldPackage[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkout = async (packageId: string) => {
    setError(null)
    setLoadingId(packageId)
    try {
      const session = await startGoldCheckout(packageId)
      if (!session.url) throw new Error('Stripe checkout URL unavailable')
      window.location.assign(session.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o checkout')
      setLoadingId(null)
    }
  }

  if (packages.length === 0) return <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-8 text-center"><p className="text-sm font-semibold">Ainda não existem pacotes Gold ativos.</p><p className="mt-2 text-xs text-muted-foreground">O checkout só é exposto quando o catálogo publicar pacotes válidos.</p></div>

  return <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {packages.map(pkg => <article key={pkg.id} className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{pkg.name}</p>
        <p className="mt-4 text-3xl font-black tabular-nums">{pkg.goldAmount.toLocaleString('pt-PT')} <span className="text-base text-primary">Gold</span></p>
        <p className="mt-2 text-sm text-muted-foreground">{new Intl.NumberFormat('pt-PT', { style:'currency', currency:pkg.fiatCurrency.toUpperCase() }).format(pkg.priceCents / 100)}</p>
        <Button className="mt-5 w-full" disabled={loadingId !== null} onClick={() => checkout(pkg.id)}>{loadingId === pkg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}Comprar Gold</Button>
      </article>)}
    </div>
    {error && <div className="rounded-xl border border-destructive/20 bg-destructive/[0.06] p-3 text-sm text-destructive">{error}</div>}
  </div>
}
