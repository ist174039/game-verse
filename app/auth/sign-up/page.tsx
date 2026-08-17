'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { LanguageSelector } from '@/components/auth/language-selector'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password !== repeatPassword) return setError('As passwords não coincidem.')
    if (password.length < 8) return setError('Usa uma password com pelo menos 8 caracteres.')

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } })
      if (signUpError) throw signUpError
      router.push('/auth/sign-up-success')
    } catch (signUpError: unknown) {
      setError(signUpError instanceof Error ? signUpError.message : 'Não foi possível criar a conta.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#050505] px-5 py-8 text-white">
      <div className="absolute left-[-12rem] bottom-[-10rem] h-[620px] w-[620px] opacity-[0.065]"><Image src="/brand/clan-logo.svg" alt="" fill className="object-contain" /></div>
      <div className="absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 bg-primary/[0.045] blur-[120px]" />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Página inicial</Link><LanguageSelector /></div>

        <div className="grid min-h-[calc(100svh-100px)] items-center gap-12 py-10 lg:grid-cols-[1fr_460px]">
          <section className="hidden max-w-xl lg:block">
            <Image src="/brand/clan-logo.svg" alt="Clã das Sombras" width={150} height={150} className="h-36 w-36 object-contain" priority />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-primary">A tua carreira começa aqui</p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[.95] tracking-[-0.055em]">Cria a identidade.<br /><span className="text-primary">Depois cria o clube.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/45">Uma conta é uma identidade única na plataforma. Em cada universo podes ter um clube diferente, sem duplicar utilizadores nem misturar economias.</p>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b]/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center gap-3 lg:hidden"><Image src="/brand/clan-logo.svg" alt="Clã das Sombras" width={56} height={56} className="h-14 w-14 object-contain" /><div><p className="text-xs font-black uppercase text-primary">Clã das Sombras</p><p className="text-[10px] uppercase tracking-[.13em] text-white/30">Criar identidade</p></div></div>
            <div className="mt-6 lg:mt-0"><p className="clan-kicker">Novo manager</p><h2 className="mt-2 text-2xl font-black">Criar conta</h2><p className="mt-2 text-sm text-muted-foreground">A tua identidade será global em todos os universos.</p></div>

            <form onSubmit={handleSignUp} className="mt-7 space-y-5">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="manager@exemplo.pt" className="h-10 border-white/[0.08] bg-black/25" /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 border-white/[0.08] bg-black/25" /></div>
              <div className="space-y-2"><Label htmlFor="repeat-password">Confirmar password</Label><Input id="repeat-password" type="password" required value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} className="h-10 border-white/[0.08] bg-black/25" /></div>
              {error && <p className="rounded-lg border border-destructive/20 bg-destructive/[0.06] p-3 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="h-10 w-full font-bold" disabled={isLoading}>{isLoading ? 'A criar…' : 'Criar identidade'}</Button>
            </form>

            <div className="relative my-6"><Separator /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0b0b0b] px-3 text-[10px] uppercase tracking-[.13em] text-muted-foreground">ou continuar com</span></div>
            <OAuthButtons />
            <div className="mt-6 flex items-start gap-2 border-t border-white/[0.06] pt-4"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-[11px] leading-5 text-muted-foreground">O registo social e email/password convergem para a mesma identidade global. O onboarding do clube será contextual ao universo escolhido.</p></div>
            <p className="mt-6 text-center text-sm text-muted-foreground">Já tens conta? <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80">Entrar</Link></p>
          </section>
        </div>
      </div>
    </main>
  )
}
