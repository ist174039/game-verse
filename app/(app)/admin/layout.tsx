import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppWindow, Banknote, Database, Globe2, Landmark, LayoutDashboard, ReceiptText, Settings, ShieldAlert, Swords, Tickets, Users } from 'lucide-react'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'
import { PlatformLink } from '@/components/admin/platform-link'

export const dynamic='force-dynamic'

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const session=await getAdminSession()
  if(!session) redirect('/admin-access')
  const items=[
    {href:'/admin',label:'Overview',icon:LayoutDashboard,show:true},
    {href:'/admin/users',label:'Utilizadores',icon:Users,show:true},
    {href:'/admin/players',label:'Jogadores',icon:Database,show:true},
    {href:'/admin/universes',label:'Universos',icon:Globe2,show:true},
    {href:'/admin/competition',label:'Competição',icon:Swords,show:true},
    {href:'/admin/economy',label:'Economia',icon:Landmark,show:true},
    {href:'/admin/payments',label:'Pagamentos',icon:Banknote,show:true},
    {href:'/admin/backoffice',label:'Backoffice',icon:Tickets,show:session.role!=='read_only_analyst'},
    {href:'/admin/config',label:'Config',icon:Settings,show:canAdmin(session.role,'CONFIG')},
    {href:'/admin/audit',label:'Audit',icon:ReceiptText,show:true},
  ].filter(i=>i.show)

  return <div>
    <div className="mb-6 overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-2">
      <nav className="flex min-w-max items-center gap-1">
        <PlatformLink className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.06] px-3 text-xs font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/[0.1]"><AppWindow className="h-3.5 w-3.5"/>Plataforma</PlatformLink>
        <span className="mx-1 h-5 w-px bg-white/[0.08]" aria-hidden="true" />
        {items.map(({href,label,icon:Icon})=><Link key={href} href={href} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"><Icon className="h-3.5 w-3.5"/>{label}</Link>)}
      </nav>
    </div>
    {children}
    <div className="mt-8 flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/[.02] px-4 py-3 text-[10px] uppercase tracking-[.12em] text-muted-foreground"><ShieldAlert className="h-3.5 w-3.5 text-primary"/>Admin protegido por admin_user + RBAC + TOTP AAL2 · service key nunca é exposta ao cliente</div>
  </div>
}
