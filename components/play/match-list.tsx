import { History, Swords } from 'lucide-react'
import { MatchCard } from './match-card'
import type { MatchContextReadModel } from '@/lib/application/read-models'

export function MatchList({ matches, universeId, emptyMessage, title, icon = 'active' }: { matches: MatchContextReadModel[]; universeId: string; emptyMessage: string; title: string; icon?: 'active' | 'history' }) {
  return <div className="rounded-xl border border-border bg-card"><div className="border-b border-border p-4"><div className="flex items-center gap-2">{icon === 'active' ? <Swords className="h-5 w-5 text-accent" /> : <History className="h-5 w-5 text-muted-foreground" />}<h3 className="font-semibold text-foreground">{title}</h3><span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{matches.length}</span></div></div><div className="divide-y divide-border">{matches.length === 0 ? <div className="p-8 text-center"><Swords className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">{emptyMessage}</p></div> : matches.map(context => <div key={context.match.id} className="p-3"><MatchCard context={context} universeId={universeId} /></div>)}</div></div>
}
