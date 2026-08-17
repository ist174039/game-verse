'use client'

import { Coins, LockKeyhole, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MarketListingWithSeller } from '@/lib/types'

interface MarketListingCardProps {
  listing: MarketListingWithSeller
  userId: string
  canDelete?: boolean
}

export function MarketListingCard({ listing, userId, canDelete }: MarketListingCardProps) {
  const isOwner = listing.seller_id === userId || canDelete

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(245,191,22,.09),transparent_38%),linear-gradient(180deg,#111,#080808)]">
        <div className="absolute inset-5 rounded-[28px] border border-primary/15" />
        <div className="absolute inset-9 rounded-[24px] border border-white/[0.06]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-24 w-20 flex-col items-center justify-center rounded-xl border border-primary/25 bg-black/60 shadow-[0_0_36px_rgba(245,191,22,.08)]">
            <Shield className="h-8 w-8 text-primary" />
            <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-primary/80">Asset</span>
          </div>
        </div>
        <span className="absolute left-4 top-4 rounded-md border border-white/[0.08] bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Legacy listing</span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-foreground">{listing.card_name}</h3>
            <p className="mt-1 truncate text-xs uppercase tracking-[0.12em] text-muted-foreground">{listing.card_type || 'Ativo de mercado'}</p>
          </div>
          <span className="rounded-md border border-primary/15 bg-primary/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">{listing.card_rarity}</span>
        </div>

        {listing.description && <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{listing.description}</p>}

        <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{listing.seller?.username || 'Vendedor indisponível'}</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Preço de referência</p>
            <div className="mt-1 flex items-center gap-1.5"><Coins className="h-4 w-4 text-[var(--silver)]" /><span className="text-lg font-black tabular-nums">{listing.price.toLocaleString('pt-PT')}</span><span className="text-[10px] font-semibold text-[var(--silver)]">Silver</span></div>
          </div>
          <Button size="sm" disabled title="Ativado com o novo ledger Silver">
            <LockKeyhole className="mr-1.5 h-3.5 w-3.5" />{isOwner ? 'Gerir' : 'Comprar'}
          </Button>
        </div>
      </div>
    </article>
  )
}
