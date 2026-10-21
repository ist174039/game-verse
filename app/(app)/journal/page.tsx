import { redirect } from 'next/navigation'
import { Newspaper } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { resolveOwnedUniverseContext, onboardingHref } from '@/lib/server/active-universe'
import { EmptyState } from '@/components/ui/async-state'

export const dynamic = 'force-dynamic'

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)
  const { selected, onboardingUniverseId } = resolveOwnedUniverseContext(directory.entries, (await searchParams).universe)
  if (onboardingUniverseId) redirect(onboardingHref(onboardingUniverseId))
  if (!selected?.club) redirect('/onboarding')

  const articles = await services.communications.listJournal(selected.universe.id, 50)

  return <div className="space-y-6">
    <header className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <p className="clan-kicker">{selected.universe.name}</p>
      <div className="mt-2 flex items-center gap-3"><Newspaper className="size-6 text-primary" aria-hidden="true"/><h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Jornal do universo</h1></div>
      <p className="mt-3 text-sm text-muted-foreground">Resultados, transferências e acontecimentos competitivos do teu universo.</p>
    </header>
    <section aria-label="Artigos do jornal" className="clan-panel-neutral rounded-2xl p-4 sm:p-6">
      {articles.length === 0 ? <EmptyState title="Ainda não há notícias" description="Os acontecimentos importantes aparecerão aqui à medida que forem registados."/> : (
        <div className="divide-y divide-white/[0.06]">
          {articles.map(article => <article key={article.id} className="py-5 first:pt-1 last:pb-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-primary"><span>{article.category}</span><time className="text-muted-foreground" dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleString('pt-PT')}</time></div>
            <h2 className="mt-2 text-lg font-bold text-foreground">{article.title}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{article.body || article.summary}</p>
          </article>)}
        </div>
      )}
    </section>
  </div>
}
