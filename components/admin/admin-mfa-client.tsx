'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Loader2, LogOut, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

type MfaMode = 'enroll' | 'challenge'

interface Enrollment {
  factorId: string
  qrCode: string
  secret: string
}

function qrSource(value: string) {
  if (value.startsWith('data:')) return value
  return `data:image/svg+xml;utf-8,${encodeURIComponent(value)}`
}

function friendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : ''
  if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('code')) {
    return 'O código não é válido ou já expirou. Confirma o relógio do telemóvel e tenta novamente.'
  }
  return message || 'Não foi possível validar o segundo fator.'
}

export function AdminMfaClient({ email, mode: initialMode }: { email: string; mode: MfaMode }) {
  const router = useRouter()
  const startedRef = useRef(false)
  const [supabase] = useState(createClient)
  const [mode, setMode] = useState<MfaMode>(initialMode)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(initialMode === 'enroll')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'enroll' || startedRef.current) return
    startedRef.current = true

    async function beginEnrollment() {
      setLoading(true)
      setError(null)
      try {
        const preparedResponse = await fetch('/api/admin/mfa/enrollment', {
          method: 'POST',
          cache: 'no-store',
        })
        const prepared = await preparedResponse.json().catch(() => ({}))
        if (!preparedResponse.ok) throw new Error(prepared.error || 'Não foi possível preparar a inscrição TOTP.')
        if (prepared.mode === 'challenge') {
          setMode('challenge')
          return
        }

        const enrolled = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Clã das Sombras Admin',
          issuer: 'Clã das Sombras',
        })
        if (enrolled.error) throw enrolled.error

        setEnrollment({
          factorId: enrolled.data.id,
          qrCode: qrSource(enrolled.data.totp.qr_code),
          secret: enrolled.data.totp.secret,
        })
      } catch (cause) {
        setError(friendlyError(cause))
      } finally {
        setLoading(false)
      }
    }

    void beginEnrollment()
  }, [mode, supabase])

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    if (code.length !== 6) return

    setLoading(true)
    setError(null)
    try {
      let factorId = enrollment?.factorId
      if (!factorId) {
        const factors = await supabase.auth.mfa.listFactors()
        if (factors.error) throw factors.error
        factorId = factors.data.totp.find(factor => factor.status === 'verified')?.id
      }
      if (!factorId) throw new Error('Nenhum autenticador verificado foi encontrado.')

      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error

      const verified = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      })
      if (verified.error) throw verified.error

      const response = await fetch('/api/admin/session', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.mfa?.verified !== true) {
        throw new Error('A sessão não atingiu o nível de segurança AAL2.')
      }

      router.replace('/admin')
      router.refresh()
    } catch (cause) {
      setCode('')
      setError(friendlyError(cause))
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    if (enrollment?.factorId) {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId }).catch(() => undefined)
    }
    await supabase.auth.signOut()
    router.replace('/admin-access')
    router.refresh()
  }

  const enrolling = mode === 'enroll'

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#050505] px-5 py-10 text-white">
      <div className="absolute right-[-10rem] top-[-8rem] h-[560px] w-[560px] opacity-[0.06]"><Image src="/brand/clan-logo.svg" alt="" fill sizes="560px" className="object-contain" priority /></div>
      <div className="absolute left-1/2 top-0 h-72 w-[650px] -translate-x-1/2 bg-primary/[0.045] blur-[120px]" />

      <section className="relative w-full max-w-2xl rounded-2xl border border-white/[0.07] bg-[#0b0b0b]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)] sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary"><ShieldCheck className="h-6 w-6" /></div>
          <div><p className="clan-kicker">Segurança administrativa</p><h1 className="mt-1 text-2xl font-black">{enrolling ? 'Ativar autenticação de dois fatores' : 'Confirmar segundo fator'}</h1></div>
        </div>

        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Sessão de <span className="font-semibold text-foreground">{email}</span>. {enrolling
            ? 'O acesso administrativo exige TOTP. Digitaliza o QR code numa aplicação autenticadora e confirma o código de seis dígitos.'
            : 'Introduz o código atual da aplicação autenticadora para elevar esta sessão ao nível AAL2.'}
        </p>

        {enrolling ? (
          <div className="mt-6 grid gap-5 rounded-2xl border border-white/[0.07] bg-black/20 p-5 sm:grid-cols-[240px_1fr] sm:items-center">
            <div className="flex min-h-60 items-center justify-center rounded-xl bg-white p-3">
              {enrollment ? <Image src={enrollment.qrCode} alt="QR code TOTP" width={216} height={216} sizes="216px" unoptimized className="h-auto w-full" /> : <Loader2 className="h-7 w-7 animate-spin text-black/60" />}
            </div>
            <div>
              <div className="flex items-center gap-2 text-primary"><Smartphone className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.13em]">Aplicação autenticadora</p></div>
              <ol className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                <li>1. Adiciona uma nova conta na tua aplicação.</li>
                <li>2. Digitaliza o QR code apresentado.</li>
                <li>3. Introduz abaixo o código gerado.</li>
              </ol>
              {enrollment ? <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#0b0b0b] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Chave manual</p><code className="mt-1 block break-all text-xs font-bold tracking-[0.12em] text-foreground">{enrollment.secret}</code></div> : null}
            </div>
          </div>
        ) : null}

        <form onSubmit={verify} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-mfa-code">Código de autenticação</Label>
            <div className="relative"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input id="admin-mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event=>setCode(event.target.value.replace(/[^0-9]/g,'').slice(0,6))} placeholder="000000" className="h-12 pl-10 text-center font-mono text-lg tracking-[0.35em]" /></div>
          </div>
          {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/[0.06] p-3 text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="sm:flex-1" disabled={loading || code.length!==6 || (enrolling && !enrollment)}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:null}{enrolling?'Ativar e entrar':'Validar e entrar'}</Button>
            <Button type="button" variant="outline" onClick={()=>void signOut()} disabled={loading}><LogOut className="h-4 w-4"/>Terminar sessão</Button>
          </div>
        </form>

        <p className="mt-5 text-xs leading-5 text-muted-foreground">Sem um segundo fator válido, nenhuma operação administrativa sensível recebe acesso à chave de serviço. A única exceção é a limpeza restrita de inscrições TOTP incompletas do próprio utilizador.</p>
      </section>
    </main>
  )
}
