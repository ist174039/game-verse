import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import { canAdmin,getAdminSession } from '@/lib/server/admin-auth'
import { AdminConfigClient } from '@/components/admin/admin-config-client'

export const dynamic='force-dynamic'

export default async function AdminConfigPage(){
  const session=await getAdminSession();if(!session)redirect('/dashboard');if(!canAdmin(session.role,'CONFIG'))redirect('/admin')
  const[flagsQ,configsQ,historyQ]=await Promise.all([
    session.serviceClient.from('feature_flag').select('*').order('key'),
    session.serviceClient.from('platform_config').select('*').order('category').order('key'),
    session.serviceClient.from('platform_config_history').select('*').order('created_at',{ascending:false}).limit(40),
  ])
  if(flagsQ.error)throw flagsQ.error;if(configsQ.error)throw configsQ.error;if(historyQ.error)throw historyQ.error
  return <div className="space-y-7"><section className="rounded-2xl border border-white/[.07] bg-[#0b0b0b] p-5 sm:p-6"><Link href="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5"/>Admin</Link><div className="mt-4 flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/><h1 className="text-2xl font-black">Configuração da plataforma</h1></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Centro de configuração versionado. A interface apresenta campos humanos quando o valor é estruturável e mantém JSON apenas como modo avançado. Todas as alterações exigem motivo e ficam no histórico.</p></section><AdminConfigClient flags={(flagsQ.data??[]) as any[]} configs={(configsQ.data??[]) as any[]} history={(historyQ.data??[]) as any[]}/></div>
}
