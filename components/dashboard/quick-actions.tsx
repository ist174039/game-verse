import Link from 'next/link'
import { Award, Gem, Globe2, Shield, Store } from 'lucide-react'

const actions=[
  {label:'Gerir clube',description:'Plantel, infraestruturas e identidade',icon:Shield,href:'/club',premium:false},
  {label:'Mercado',description:'Comprar, vender e acompanhar ativos',icon:Store,href:'/market',premium:false},
  {label:'Recompensas',description:'Daily reward, missões, conquistas e Bronze Store',icon:Award,href:'/rewards',premium:false},
  {label:'Comprar Gold',description:'Moeda premium e financiamento controlado',icon:Gem,href:'/economy/buy',premium:true},
  {label:'Universos',description:'Explorar ou gerir contextos competitivos',icon:Globe2,href:'/universos',premium:false},
]

export function QuickActions(){return <section className="clan-panel-neutral rounded-2xl p-4 sm:p-5"><div className="mb-4"><p className="clan-kicker">Ações</p><h2 className="mt-1 text-lg font-semibold text-foreground">Centro operacional</h2></div><div className="space-y-1.5">{actions.map(action=>{const Icon=action.icon;return <Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-xl px-2.5 py-3 transition hover:bg-white/[0.035]"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${action.premium?'border-primary/20 bg-primary/[0.08] text-primary':'border-white/[0.06] bg-black/25 text-muted-foreground group-hover:text-foreground'}`}><Icon className="h-4.5 w-4.5"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{action.label}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{action.description}</span></span></Link>})}</div></section>}
