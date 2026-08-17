import { Clock3, Newspaper, Trophy, ShoppingCart, RefreshCw } from 'lucide-react'
import type { JournalArticle } from '@/lib/domain/communications'

interface RecentActivityProps { articles: JournalArticle[] }

export function RecentActivity({ articles }: RecentActivityProps) {
  return (
    <section className="clan-panel-neutral overflow-hidden rounded-2xl">
      <div className="flex items-end justify-between gap-4 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div><p className="clan-kicker">Atividade</p><h2 className="mt-1 text-lg font-semibold text-foreground">O que aconteceu no universo</h2></div>
        <span className="text-[11px] text-muted-foreground">Jornal</span>
      </div>
      <div className="px-2 pb-2 sm:px-3 sm:pb-3">
        {articles.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-black/15 px-5 text-center">
            <Clock3 className="h-6 w-6 text-primary/65" />
            <p className="mt-3 text-sm font-medium text-foreground">Ainda não existem acontecimentos</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">Resultados, transferências, conquistas e alterações relevantes aparecerão aqui automaticamente.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.055]">
            {articles.slice(0,5).map(article => (
              <div key={article.id} className="flex items-start gap-3 px-2 py-3.5 sm:px-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/12 bg-primary/[0.045] text-primary">{iconFor(article.category)}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{article.title}</p><p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{article.summary}</p></div>
                <p className="shrink-0 pt-0.5 text-[10px] text-muted-foreground">{formatTimeAgo(article.publishedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function iconFor(category: string) {
  if (category === 'MATCH') return <Trophy className="h-4 w-4" />
  if (category === 'MARKET') return <ShoppingCart className="h-4 w-4" />
  if (category === 'PLAYER') return <RefreshCw className="h-4 w-4" />
  return <Newspaper className="h-4 w-4" />
}

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  if (hours < 24) return `há ${hours} h`
  if (days < 7) return `há ${days} d`
  return new Date(dateStr).toLocaleDateString('pt-PT')
}
