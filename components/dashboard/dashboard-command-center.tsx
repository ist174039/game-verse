import Link from 'next/link'
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDollarSign, Shield, ShoppingCart, Swords, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DashboardReadModel } from '@/lib/application/read-models'

interface PrimaryAction { title:string; description:string; href:string; label:string; icon:typeof Swords; tone:'default'|'warning' }

export function DashboardCommandCenter({dashboard}:{dashboard:DashboardReadModel}){
  const o=dashboard.operational
  const squadReady=o.squadSize>=dashboard.universe.minSquadSize
  const infraReady=o.infrastructureCount>=5
  const competitionReady=o.registeredCompetitions>0||o.activeCompetitions>0
  const next=dashboard.nextMatchContext

  let primary:PrimaryAction={title:'Clube operacional',description:'O núcleo do clube está preparado. Usa o centro de comando para escolher a próxima ação.',href:`/play?universe=${dashboard.universe.id}`,label:'Ir para Jogar',icon:Swords,tone:'default'}
  if(!squadReady){primary={title:'O teu plantel ainda não está pronto',description:o.activeMarketListings>0?`Tens ${o.squadSize}/${dashboard.universe.minSquadSize} jogadores. Completa o plantel antes da primeira campanha.`:'Ainda não existem jogadores suficientes no teu clube e o mercado deste universo não tem listings ativos. O inventário de jogadores do provider precisa de estar disponível para o universo.',href:`/team?universe=${dashboard.universe.id}`,label:'Ver plantel',icon:Users,tone:'warning'}}
  else if(!competitionReady&&o.availableCompetitions>0){primary={title:'Escolhe a primeira competição',description:`Existem ${o.availableCompetitions} competição(ões) abertas a inscrições neste universo.`,href:`/tournaments?universe=${dashboard.universe.id}`,label:'Ver competições',icon:Swords,tone:'default'}}
  else if(next){const opponent=next.match.homeClubId===dashboard.club.id?next.awayClubName:next.homeClubName;primary={title:`Próxima partida contra ${opponent}`,description:`${next.competitionName??'Competição'} · ${formatDate(next.match.scheduledAt)} · estado ${next.match.state}.`,href:`/play?universe=${dashboard.universe.id}`,label:next.match.state==='READY'?'Preparar partida':'Ver calendário',icon:CalendarClock,tone:'default'}}
  else if(o.sponsorshipOffers>0){primary={title:'Tens uma oferta de patrocínio',description:'Revê o signing bonus e o pagamento periódico antes de aceitar o contrato.',href:`/economy?universe=${dashboard.universe.id}`,label:'Rever oferta',icon:CircleDollarSign,tone:'default'}}

  const Icon=primary.icon
  return <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
    <article className={`rounded-2xl border p-5 sm:p-6 ${primary.tone==='warning'?'border-amber-500/20 bg-amber-500/[.035]':'border-primary/15 bg-[#0b0b0b]'}`}>
      <div className="flex items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${primary.tone==='warning'?'border-amber-500/20 text-amber-300':'border-primary/20 text-primary'}`}><Icon className="h-5 w-5"/></span><div><p className="clan-kicker">Próxima ação</p><h2 className="mt-1 text-xl font-black">{primary.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{primary.description}</p></div></div>
      <div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href={primary.href}>{primary.label}</Link></Button>{!squadReady&&o.activeMarketListings>0&&<Button asChild variant="outline"><Link href={`/market?universe=${dashboard.universe.id}`}><ShoppingCart className="mr-2 h-4 w-4"/>Mercado</Link></Button>}{o.openLiabilities>0&&<Button asChild variant="outline"><Link href={`/economy?universe=${dashboard.universe.id}`}><AlertTriangle className="mr-2 h-4 w-4"/>Regularizar obrigações</Link></Button>}</div>
    </article>

    <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary"/><h2 className="text-lg font-black">Estado do clube</h2></div><div className="mt-5 space-y-3"><Step label="Clube criado" value={dashboard.club.name} ready/><Step label="Plantel competitivo" value={`${o.squadSize}/${dashboard.universe.minSquadSize} jogadores`} ready={squadReady}/><Step label="Infraestrutura base" value={`${o.infrastructureCount}/5 módulos`} ready={infraReady}/><Step label="Competição" value={competitionReady?`${o.registeredCompetitions+o.activeCompetitions} vínculo(s)`:`${o.availableCompetitions} disponível(eis)`} ready={competitionReady}/><Step label="Primeira partida" value={next?`${next.homeClubName} vs ${next.awayClubName}`:'Ainda não agendada'} ready={Boolean(next)}/></div></article>
  </section>
}

function Step({label,value,ready}:{label:string;value:string;ready:boolean}){return <div className="flex items-center gap-3 rounded-xl border border-white/[.055] bg-black/20 px-3.5 py-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ready?'bg-primary/[.10] text-primary':'bg-white/[.04] text-muted-foreground'}`}>{ready?<CheckCircle2 className="h-4 w-4"/>:<span className="h-2 w-2 rounded-full bg-current"/>}</span><div className="min-w-0"><p className="text-xs font-bold">{label}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{value}</p></div></div>}
function formatDate(value:string|null){if(!value)return'Data por definir';return new Date(value).toLocaleString('pt-PT',{dateStyle:'medium',timeStyle:'short'})}
