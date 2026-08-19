'use client'

import Image from 'next/image'
import { Coins, ShieldCheck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PlatformMarketPlayerReadModel } from '@/lib/application/read-models'

export function PlatformPlayerCard({ entry, silverBalance, buying, onBuy }: {
  entry: PlatformMarketPlayerReadModel
  silverBalance: number
  buying: boolean
  onBuy: (universePlayerId: string) => void
}) {
  const { asset, player } = entry
  const canAfford = silverBalance >= asset.platformPrice

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(245,191,22,.09),transparent_38%),linear-gradient(180deg,#111,#080808)]">
        {player.imageUrl ? <Image src={player.imageUrl} alt={player.name} fill className="object-contain object-bottom pt-8" /> : <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck className="h-16 w-16 text-primary/25" /></div>}
        <div className="absolute left-4 top-4"><p className="text-3xl font-black text-primary">{player.overall}</p><p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/60">{player.position}</p></div>
        <span className="absolute right-4 top-4 rounded-md border border-primary/20 bg-black/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-primary">PLATAFORMA</span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-base font-bold">{player.name}</h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{player.nationality || 'Nacionalidade não indicada'} · contratação direta</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-xs">
          <div><p className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Valor ref.</p><p className="mt-1 font-bold">{asset.marketReferenceValue.toLocaleString('pt-PT')} S</p></div>
          <div><p className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Preço fixo</p><p className="mt-1 font-bold text-primary">{asset.platformPrice.toLocaleString('pt-PT')} S</p></div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Coins className="h-3.5 w-3.5" />Contrato incluído</span>
          <Button size="sm" disabled={!canAfford || buying} onClick={() => onBuy(asset.id)}>
            <Store className="h-3.5 w-3.5" />
            {buying ? 'A contratar…' : canAfford ? 'Contratar' : 'Silver insuficiente'}
          </Button>
        </div>
      </div>
    </article>
  )
}
