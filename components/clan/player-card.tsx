import Image from 'next/image'
import { Activity, Coins, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlayerAssetStatus = 'available' | 'owned' | 'listed' | 'auction' | 'unavailable' | 'free-agent'

export interface PlayerCardData {
  name: string
  position: string
  rating: number
  imageUrl?: string | null
  marketValue?: number | null
  salary?: number | null
  status?: PlayerAssetStatus
  nationality?: string | null
  sourceLabel?: string | null
}

const statusLabels: Record<PlayerAssetStatus, string> = {
  available: 'Disponível',
  owned: 'No plantel',
  listed: 'À venda',
  auction: 'Leilão',
  unavailable: 'Indisponível',
  'free-agent': 'Livre',
}

export function PlayerCard({ player, compact = false, className }: { player: PlayerCardData; compact?: boolean; className?: string }) {
  const status = player.status || 'available'

  return (
    <article className={cn('group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b]', className)}>
      <div className={cn('relative overflow-hidden bg-[radial-gradient(circle_at_50%_22%,rgba(245,191,22,.14),transparent_38%),linear-gradient(180deg,#15130c,#080808)]', compact ? 'aspect-[5/3]' : 'aspect-[4/5]')}>
        <div className="absolute inset-3 rounded-[20px] border border-primary/15" />
        {player.imageUrl ? (
          <Image src={player.imageUrl} alt={player.name} fill className="object-contain object-bottom pt-8" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck className="h-16 w-16 text-primary/25" /></div>
        )}
        <div className="absolute left-4 top-4">
          <p className="text-3xl font-black leading-none tracking-[-0.05em] text-primary">{player.rating}</p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/60">{player.position}</p>
        </div>
        <span className="absolute right-4 top-4 rounded-md border border-white/10 bg-black/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-white/65">{statusLabels[status]}</span>
        {!compact && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/60 to-transparent" />}
      </div>

      <div className={cn('relative', compact ? 'p-4' : '-mt-12 p-5 pt-0')}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{player.sourceLabel || 'Rating externo'}</p>
        <h3 className="mt-1 truncate text-xl font-black tracking-[-0.025em] text-foreground">{player.name}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
          <PlayerDatum icon={Coins} label="Valor" value={player.marketValue == null ? '—' : `${player.marketValue.toLocaleString('pt-PT')} S`} />
          <PlayerDatum icon={Activity} label="Salário" value={player.salary == null ? '—' : `${player.salary.toLocaleString('pt-PT')} / J`} />
        </div>
      </div>
    </article>
  )
}

function PlayerDatum({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return <div><div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground"><Icon className="h-3 w-3" />{label}</div><p className="mt-1 text-sm font-bold tabular-nums text-foreground">{value}</p></div>
}
