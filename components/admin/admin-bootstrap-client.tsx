'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BootstrapResult {
  email: string
  createdAuthUser: boolean
}

function friendlyError(code: string) {
  if (code === 'unauthorized') return 'O segredo não corresponde a ADMIN_BOOTSTRAP_SECRET em Production.'
  if (code === 'admin_bootstrap_secret_not_configured') return 'ADMIN_BOOTSTRAP_SECRET não está configurado ou tem menos de 16 caracteres.'
  if (code === 'admin_bootstrap_email_not_configured') return 'ADMIN_BOOTSTRAP_EMAIL não está configurado corretamente.'
  if (code === 'admin_auth_user_not_found') return 'A conta Auth ainda não existe e ADMIN_BOOTSTRAP_PASSWORD não está configurada com pelo menos 12 caracteres.'
  if (code.includes('admin_bootstrap_closed')) return 'Já existe outro administrador ativo. Entra com essa conta ou gere os acessos a partir do painel Admin.'
  if (code.includes('service_bootstrap_admin_by_email') || code.includes('PGRST202')) return 'A migration 00440_admin_identity_bootstrap.sql ainda não está aplicada no Supabase ligado à produção.'
  return 'Não foi possível criar o administrador. Confirma as três variáveis de bootstrap e a migration 00440.'
}

export function AdminBootstrapClient() {
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BootstrapResult | null>(null)

  async function bootstrap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/internal/admin/bootstrap', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret.trim()}` },
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'admin_bootstrap_failed')

      setSecret('')
      setResult({
        email: typeof payload.admin?.email === 'string' ? payload.admin.email : 'o email configurado',
        createdAuthUser: payload.createdAuthUser === true,
      })
    } catch (cause) {
      setError(friendlyError(cause instanceof Error ? cause.message : 'admin_bootstrap_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#050505] px-5 py-10 text-white">
      <div className="absolute right-[-10rem] top-[-8rem] h-[560px] w-[560px] opacity-[0.06]"><Image src="/brand/clan-logo.svg" alt="" fill sizes="560px" className="object-contain" priority /></div>
      <div className="absolute left-1/2 top-0 h-72 w-[650px] -translate-x-1/2 bg-primary/[0.045] blur-[120px]" />

      <section className="relative w-full max-w-lg rounded-2xl border border-white/[0.07] bg-[#0b0b0b]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)] sm:p-8">
        <Link href="/admin-access" className="inline-flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Voltar ao login</Link>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary"><ShieldCheck className="h-6 w-6" /></div>
          <div><p className="clan-kicker">Configuração única</p><h1 className="mt-1 text-2xl font-black">Primeiro administrador</h1></div>
        </div>

        {result ? (
          <div className="mt-6">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
              <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-5 w-5" /><p className="font-black">Administrador configurado</p></div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A conta <span className="font-semibold text-foreground">{result.email}</span> {result.createdAuthUser ? 'foi criada no Supabase Auth e promovida' : 'já existia e foi promovida'} a Super Admin.
              </p>
            </div>
            <Button asChild className="mt-5 h-10 w-full font-bold"><Link href="/admin-access">Entrar e ativar TOTP</Link></Button>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Depois do primeiro login, remove ADMIN_BOOTSTRAP_PASSWORD e ADMIN_BOOTSTRAP_SECRET da Vercel e faz um novo deployment.</p>
          </div>
        ) : (
          <>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">Esta operação usa o email e a password definidos nas variáveis de Production. Introduz apenas o segredo temporário configurado em <code className="text-foreground">ADMIN_BOOTSTRAP_SECRET</code>.</p>

            <form onSubmit={bootstrap} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-bootstrap-secret">Segredo de bootstrap</Label>
                <div className="relative"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="admin-bootstrap-secret" type="password" autoComplete="off" minLength={16} required value={secret} onChange={event => setSecret(event.target.value)} placeholder="Mínimo de 16 caracteres" className="h-11 border-white/[0.08] bg-black/25 pl-10" /></div>
              </div>
              {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/[0.06] p-3 text-sm leading-5 text-destructive">{error}</p> : null}
              <Button type="submit" className="h-10 w-full font-bold" disabled={loading || secret.trim().length < 16}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{loading ? 'A configurar…' : 'Criar primeiro administrador'}</Button>
            </form>

            <p className="mt-5 text-xs leading-5 text-muted-foreground">O segredo é enviado uma única vez por HTTPS, não é guardado e nunca é incluído nos logs da aplicação.</p>
          </>
        )}
      </section>
    </main>
  )
}
