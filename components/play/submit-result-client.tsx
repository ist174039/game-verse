'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ShieldCheck, Swords, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function SubmitResultClient({ matchId, userId, universeId, isHome, homeClubName, awayClubName }: { matchId: string; userId: string; universeId: string; isHome: boolean; homeClubName: string; awayClubName: string }) {
  const router = useRouter()
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const home = Number(homeScore)
    const away = Number(awayScore)
    if (!Number.isSafeInteger(home) || !Number.isSafeInteger(away) || home < 0 || away < 0) {
      setError('Introduz resultados inteiros e não negativos.')
      return
    }
    if (evidence && evidence.size > 25 * 1024 * 1024) {
      setError('A evidência não pode exceder 25 MB.')
      return
    }

    setLoading(true)
    try {
      if (evidence) {
        const ext = evidence.name.split('.').pop()?.toLowerCase() || 'bin'
        const uploadedPath = `${matchId}/${userId}-${crypto.randomUUID()}.${ext}`
        const supabase = createClient()
        const { error: uploadError } = await supabase.storage.from('match-evidence').upload(uploadedPath, evidence, { upsert: false, contentType: evidence.type || undefined })
        if (uploadError) throw new Error(`evidence_upload_failed: ${uploadError.message}`)

        const evidenceResponse = await fetch('/api/competition/evidence', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            matchId,
            filePath: uploadedPath,
            metadata: { originalName: evidence.name, size: evidence.size, mimeType: evidence.type || null },
          }),
        })
        const evidencePayload = await evidenceResponse.json()
        if (!evidenceResponse.ok) {
          await supabase.storage.from('match-evidence').remove([uploadedPath])
          throw new Error(evidencePayload.error || 'evidence_registration_failed')
        }
      }

      const response = await fetch('/api/competition/submit-result', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore: home, awayScore: away, idempotencyKey: `match-submit:${crypto.randomUUID()}` }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'submit_result_failed')
      router.push(`/play?universe=${universeId}`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível submeter o resultado.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="mx-auto max-w-xl space-y-6">
    <Link href={`/play?universe=${universeId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar às partidas</Link>
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-7">
      <div className="flex items-start gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.07]"><Swords className="h-5 w-5 text-primary" /></div><div><p className="clan-kicker">Resultado</p><h1 className="mt-1 text-2xl font-black">{homeClubName} vs {awayClubName}</h1><p className="mt-2 text-sm text-muted-foreground">Submetes o marcador completo da partida. O adversário terá de confirmar antes do settlement.</p></div></div>
      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div className="grid grid-cols-2 gap-4"><ScoreField id="home-score" label={`${homeClubName}${isHome ? ' · teu clube' : ''}`} value={homeScore} onChange={setHomeScore} /><ScoreField id="away-score" label={`${awayClubName}${!isHome ? ' · teu clube' : ''}`} value={awayScore} onChange={setAwayScore} /></div>
        <div><Label htmlFor="match-evidence">Evidência opcional</Label><label htmlFor="match-evidence" className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-white/[0.015] p-6 text-center transition hover:bg-white/[0.03]"><Upload className="h-6 w-6 text-primary/70" /><p className="mt-2 text-sm font-medium">{evidence ? evidence.name : 'Adicionar screenshot, PDF ou vídeo'}</p><p className="mt-1 text-xs text-muted-foreground">Upload privado e registo relacional na partida. A evidência deixa de ser apenas um ficheiro solto no Storage.</p></label><input id="match-evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4" className="hidden" onChange={event => setEvidence(event.target.files?.[0] ?? null)} /></div>
        <div className="rounded-xl border border-primary/12 bg-primary/[0.035] p-4 text-xs leading-5 text-muted-foreground"><p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />A evidência é validada contra a partida e o utilizador antes de ser registada. O resultado continua a passar por <strong className="text-foreground">submit_match_result</strong>; não existe update direto à tabela match.</p></div>
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-300">{error}</div>}
        <Button className="w-full" type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submeter resultado</Button>
      </form>
    </section>
  </div>
}

function ScoreField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id} className="line-clamp-1">{label}</Label><Input id={id} inputMode="numeric" value={value} onChange={event => onChange(event.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className="h-16 text-center text-2xl font-black" required /></div>
}
