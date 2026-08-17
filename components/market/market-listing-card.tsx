'use client'

import Image from 'next/image'
import { Coins, Gavel, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MarketListingReadModel } from '@/lib/application/read-models'

export function MarketListingCard({ entry, ownClubId, buying = false, onBuy }: { entry: MarketListingReadModel; ownClubId: string; buying?: boolean; onBuy?: (listingId: string) => void }) {
  const { listing, player, sellerClub } = entry
  const ownListing = listing.sellerClubId === ownClubId
  const price = listing.askingPrice ?? listing.buyNowPrice ?? 0
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(245,191,22,.09),transparent_38%),linear-gradient(180deg,#111,#080808)]">
        {player.imageUrl ? <Image src={player.imageUrl} alt={player.name} fill className="object-contain object-bottom pt-8" /> : <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck className="h-16 w-16 text-primary/25" /></div>}
        <div className="absolute left-4 top-4"><p className="text-3xl font-black text-primary">{player.overall}</p><p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/60">{player.position}</p></div>
        <span className="absolute right-4 top-4 rounded-md border border-white/10 bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-white/65">{listing.listingType === 'AUCTION' ? 'LEILÃO' : 'VENDA DIRETA'}</span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-base font-bold">{player.name}</h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{player.nationality || 'Nacionalidade não indicada'} · {sellerClub.name}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-xs">
          <div><p className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Valor ref.</p><p className="mt-1 font-bold">{entry.asset.marketReferenceValue.toLocaleString('pt-PT')} S</p></div>
          <div><p className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">{listing.listingType === 'AUCTION' ? 'Maior bid' : 'Preço'}</p><p className="mt-1 font-bold text-primary">{(entry.highestBid ?? price).toLocaleString('pt-PT')} S</p></div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">{listing.listingType === 'AUCTION' ? <Gavel className="h-3.5 w-3.5" /> : <Coins className="h-3.5 w-3.5" />}{listing.listingType === 'AUCTION' ? `${entry.bidCount} bids` : 'Liquidação via ledger'}</span>
          {listing.listingType === 'DIRECT' && <Button size="sm" disabled={ownListing || buying || !onBuy} onClick={() => onBuy?.(listing.id)}>{ownListing ? 'Tua listagem' : buying ? 'A comprar…' : 'Comprar'}</Button>}
        </div>
      </div>
    </article>
  )
}
