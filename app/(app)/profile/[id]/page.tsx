import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Award, Globe2, Shield, ShieldCheck, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const services = createApplicationServices(supabase)
  const model = await services.reads.profile.load(id)
  if (!model) return notFound()

  return <div className="mx-auto max-w-5xl space-y-7">
    <section className="brand-watermark overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-7">
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/18 bg-primary/[0.05]">
          {model.profile.avatarUrl ? <Image src={model.profile.avatarUrl} alt={model.profile.username} fill className="object-cover" /> : <UserRound className="h-10 w-10 text-primary/60" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="clan-kicker">Manager global</p>
          <h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em]">{model.profile.username}</h1>
          <p className="mt-2 text-sm text-muted-foreground">A identidade é global. Elo, prestígio, adeptos e contexto competitivo pertencem a cada clube dentro do respetivo universo.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Badge label={`Nível ${model.profile.managerLevel}`} /><Badge label={`${model.profile.managerXp.toLocaleString('pt-PT')} XP`} /><Badge label={`Reputação ${model.profile.reputation}`} /><Badge label={model.profile.locale || 'pt'} /></div>
        </div>
        {user.id === model.profile.id && <Button variant="outline" disabled>Editar perfil</Button>}
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      <Domain icon={Award} title="Manager Level" text="Progressão permanente da conta, separada do desempenho competitivo de cada clube." />
      <Domain icon={ShieldCheck} title="Reputação" text="Sinal global de fiabilidade e comportamento do manager na plataforma." />
      <Domain icon={Globe2} title="Carreira multi-universo" text="Cada universo mantém o seu clube, Elo, prestígio, adeptos e economia." />
    </section>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Clubes</p><h2 className="mt-1 text-xl font-black">Contextos competitivos</h2></div><Shield className="h-5 w-5 text-primary" /></div>
      <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {model.clubs.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Este manager ainda não tem clubes.</p> : model.clubs.map(({ club, universe }) => <div key={club.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary">{universe.name}</p><p className="mt-1 text-lg font-black">{club.name}</p><p className="mt-1 text-xs text-muted-foreground">Elo {club.elo.toLocaleString('pt-PT')} · Prestígio {club.prestige.toLocaleString('pt-PT')} · {club.fans.toLocaleString('pt-PT')} adeptos</p></div>{user.id === model.profile.id && <Button asChild variant="outline"><Link href={`/club?universe=${universe.id}`}>Ver clube</Link></Button>}</div>)}
      </div>
    </section>
  </div>
}

function Badge({ label }: { label:string }) { return <span className="rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{label}</span> }
function Domain({ icon:Icon, title, text }: { icon:typeof Award; title:string; text:string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
