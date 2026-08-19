'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function AdminLoginClient() {
  const router = useRouter()
  const [supabase] = useState(createClient)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) throw authError

      const response = await fetch('/api/admin/session', { method: 'GET', cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        await supabase.auth.signOut()
        throw new Error(payload.error === 'admin_access_required'
          ? 'Esta conta é válida, mas não está registada como administrador ativo.'
          : payload.error || 'Não foi possível validar o acesso administrativo.')
      }

      router.replace(payload.mfa?.verified === true ? '/admin' : '/admin-access')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a sessão administrativa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#050505] px-5 py-10 text-white">
      <div className="absolute right-[-10rem] top-[-8rem] h-[560px] w-[560px] opacity-[0.06]"><Image src="/brand/clan-logo.svg" alt="" fill sizes="560px" className="object-contain" priority /></div>
      <div className="absolute left-1/2 top-0 h-72 w-[650px] -translate-x-1/2 bg-primary/[0.045] blur-[120px]" />

      <section className="relative w-full max-w-md rounded-2xl border border-white/[0.07] bg-[#0b0b0b]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)] sm:p-8">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0"><Image src="/brand/clan-logo.svg" alt="Clã das Sombras" fill className="object-contain" priority /></div>
          <div><p className="clan-kicker">Acesso interno</p><h1 className="mt-1 text-2xl font-black">Admin do Clã</h1></div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-primary/12 bg-primary/[0.025] p-4"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><p className="text-xs leading-5 text-muted-foreground">A autorização é validada server-side pela tabela <code className="text-foreground">admin_user</code>. Depois da password, o acesso exige um código da aplicação autenticadora.</p></div>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div className="space-y-2"><Label htmlFor="admin-email">Email</Label><Input id="admin-email" type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="admin@exemplo.pt" className="h-10 border-white/[0.08] bg-black/25" /></div>
          <div className="space-y-2"><Label htmlFor="admin-password">Password</Label><div className="relative"><Input id="admin-password" type={showPassword?'text':'password'} autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} className="h-10 border-white/[0.08] bg-black/25 pr-10"/><button type="button" aria-label={showPassword?'Ocultar password':'Mostrar password'} onClick={()=>setShowPassword(value=>!value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground">{showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></div>
          {error&&<p className="rounded-lg border border-destructive/20 bg-destructive/[0.06] p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-10 w-full font-bold" disabled={loading}>{loading?'A validar…':'Entrar no Admin'}</Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">Acesso de manager? <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80">Entrar na plataforma</Link></p>
      </section>
    </main>
  )
}
