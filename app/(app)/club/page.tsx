import { redirect } from 'next/navigation'
import { CalendarDays, Crown, Shield, Target, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { resolveOwnedUniverseContext, onboardingHref } from '@/lib/server/active-universe'
import { CurrencyDisplay } from '@/components/clan/currency-display'
import { InfrastructureUpgradesClient, type InfrastructureQuote } from '@/components/club/infrastructure-upgrades-client'
import { ClubIdentityClient, type ClubKitView } from '@/components/club/club-identity-client'
import type { ClubInfrastructureReadModel } from '@/lib/application/read-models'

const TYPES:ClubInfrastructureReadModel['type'][]=['STADIUM','ACADEMY','TRAINING','MARKETING','FINANCE']
const KIT_TYPES:ClubKitView['type'][]=['HOME','AWAY','THIRD']
const KIT_DEFAULTS:Record<ClubKitView['type'],Pick<ClubKitView,'primaryColor'|'secondaryColor'>>={
  HOME:{primaryColor:'#111111',secondaryColor:'#F5BF16'},
  AWAY:{primaryColor:'#F5BF16',secondaryColor:'#111111'},
  THIRD:{primaryColor:'#FFFFFF',secondaryColor:'#111111'},
}

export default async function ClubPage({searchParams}:{searchParams:Promise<{universe?:string}>}){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user||user.is_anonymous)redirect('/auth/login')
  const services=createApplicationServices(supabase)
  const directory=await services.reads.universeDirectory.load(user.id)
  const requested=(await searchParams).universe
  const{selected,onboardingUniverseId}=resolveOwnedUniverseContext(directory.entries,requested)
  if(onboardingUniverseId)redirect(onboardingHref(onboardingUniverseId))
  if(!selected?.club)redirect('/onboarding')
  const overview=await services.reads.clubOverview.load(user.id,selected.universe.id)
  if(!overview)redirect(onboardingHref(selected.universe.id))

  const [configQ,kitsQ]=await Promise.all([
    supabase.from('platform_config').select('value').eq('key','economy.infrastructure_upgrade').maybeSingle(),
    supabase.from('club_kit').select('kit_type,image_url,primary_color,secondary_color').eq('club_id',overview.club.id),
  ])
  if(configQ.error)throw configQ.error
  if(kitsQ.error)throw kitsQ.error
  const cfg=(configQ.data?.value??{}) as any
  const max=Number(cfg.max_level??5)
  const quotes:InfrastructureQuote[]=TYPES.map(type=>{const level=overview.infrastructure.find(i=>i.type===type)?.level??0;const next=level>=max?null:level+1;const base=Number(cfg.costs?.[type]??0);const maint=Number(cfg.maintenance?.[type]??0);return{type,currentLevel:level,nextLevel:next,costSilver:next&&base>0?base*next:null,nextMaintenanceCost:next&&maint>0?maint*next:null,maxLevel:max}})
  const rows=(kitsQ.data??[]) as Array<{kit_type:ClubKitView['type'];image_url:string|null;primary_color:string;secondary_color:string}>
  const kits:ClubKitView[]=KIT_TYPES.map(type=>{const row=rows.find(item=>item.kit_type===type);return{type,imageUrl:row?.image_url??null,primaryColor:row?.primary_color??KIT_DEFAULTS[type].primaryColor,secondaryColor:row?.secondary_color??KIT_DEFAULTS[type].secondaryColor}})

  return <div className="space-y-7">
    <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-black/45">{overview.club.logoUrl?<img src={overview.club.logoUrl} alt={`Emblema ${overview.club.name}`} className="h-full w-full object-contain p-2"/>:<Shield className="h-9 w-9 text-primary/55"/>}</div><div className="min-w-0"><div className="flex items-center gap-2 text-primary"><Shield className="h-4 w-4"/><p className="clan-kicker">Clube · {overview.universe.name}</p></div><h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em] sm:text-4xl">{overview.club.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{overview.club.motto||'Clube ativo neste universo.'}</p><p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Criado em {new Date(overview.club.createdAt).toLocaleDateString('pt-PT')} · Elo {overview.club.elo.toLocaleString('pt-PT')} · Prestígio {overview.club.prestige.toLocaleString('pt-PT')}</p></div></div><CurrencyDisplay kind="silver" amount={overview.silverBalance} label="Tesouraria do clube"/></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric icon={CalendarDays} label="Jogos" value={overview.performance.played.toLocaleString('pt-PT')}/><Metric icon={Trophy} label="Vitórias" value={overview.performance.won.toLocaleString('pt-PT')}/><Metric icon={Target} label="Empates" value={overview.performance.drawn.toLocaleString('pt-PT')}/><Metric icon={Target} label="Derrotas" value={overview.performance.lost.toLocaleString('pt-PT')}/><Metric icon={Crown} label="Win rate" value={`${overview.performance.winRatePct}%`}/><Metric icon={Shield} label="Golos" value={`${overview.performance.goalsFor}-${overview.performance.goalsAgainst}`}/></section>

    <ClubIdentityClient clubId={overview.club.id} name={overview.club.name} motto={overview.club.motto} logoUrl={overview.club.logoUrl} kits={kits}/>

    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Infraestruturas</p><h2 className="mt-1 text-xl font-black">Capacidade operacional</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Cada melhoria aumenta o nível e a manutenção recorrente. O custo abaixo vem da configuração económica ativa e é validado novamente no servidor no momento da liquidação.</p></div><div className="mt-5"><InfrastructureUpgradesClient clubId={overview.club.id} silverBalance={overview.silverBalance} infrastructure={overview.infrastructure} quotes={quotes}/></div></section>
  </div>
}
function Metric({icon:Icon,label,value}:{icon:typeof Trophy;label:string;value:string}){return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><Icon className="h-4 w-4 text-primary"/>{label}</div><p className="mt-3 text-xl font-black tabular-nums">{value}</p></article>}
