import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage({searchParams}:{searchParams:Promise<{universe?:string}>}) {
  const supabase=await createClient()
  const { data:{user} }=await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const services=createApplicationServices(supabase)
  const onboarding=await services.reads.onboarding.load(user.id)
  const requested=(await searchParams).universe

  if(requested){
    const universe=onboarding.availableUniverses.find(item=>item.id===requested)
    if(!universe)redirect('/universos')
    if(onboarding.existingClubUniverseIds.includes(requested))redirect(`/dashboard?universe=${encodeURIComponent(requested)}`)
    return <OnboardingShell title="Cria o teu clube neste universo." description="A identidade do manager continua global; apenas o novo clube, Silver, plantel, mercado e carreira competitiva ficam isolados neste universo."><OnboardingForm universes={[universe]} initialUniverseId={universe.id} /></OnboardingShell>
  }

  if (onboarding.nextStep==='COMPLETE') redirect('/dashboard')
  const eligible=onboarding.availableUniverses.filter(universe=>!onboarding.existingClubUniverseIds.includes(universe.id))
  return <OnboardingShell title="A tua carreira começa com uma decisão." description="Escolhe o universo e cria o teu primeiro clube. A identidade do manager é global; o clube, a economia Silver e a carreira competitiva pertencem ao universo escolhido.">{eligible.length > 0 ? <OnboardingForm universes={eligible} /> : <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-6"><h2 className="text-lg font-bold">Nenhum universo disponível</h2><p className="mt-2 text-sm text-muted-foreground">A plataforma ainda não tem um universo aberto para receber clubes.</p></section>}</OnboardingShell>
}

function OnboardingShell({title,description,children}:{title:string;description:string;children:React.ReactNode}){return <div className="mx-auto max-w-5xl space-y-6 py-2 sm:py-4"><header className="brand-watermark rounded-3xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-7 sm:px-8 sm:py-9"><p className="clan-kicker">Primeiros passos</p><h1 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.04em] text-foreground sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p></header>{children}</div>}
