'use client'

import { useState } from 'react'
import { Check, Edit2, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Club } from '@/lib/types'

interface ClubHeaderProps {
  club: Club
}

export function ClubHeader({ club }: ClubHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(club.name)
  const [motto, setMotto] = useState(club.motto || '')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('club')
      .update({ name, motto, updated_at: new Date().toISOString() })
      .eq('id', club.id)

    if (!error) {
      setIsEditing(false)
      router.refresh()
    }
    setIsSaving(false)
  }

  const handleCancel = () => {
    setName(club.name)
    setMotto(club.motto || '')
    setIsEditing(false)
  }

  return (
    <section className="clan-panel brand-watermark relative overflow-hidden rounded-3xl p-5 shadow-panel sm:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/85 to-transparent" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-black/45 sm:h-24 sm:w-24">
            {club.logo_url ? (
              <img src={club.logo_url} alt={`Emblema ${club.name}`} className="h-full w-full object-cover" />
            ) : (
              <img src="/brand/clan-logo.svg" alt="Clã das Sombras" className="h-[78%] w-[78%] object-contain" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_110%,rgba(245,191,22,.2),transparent_50%)]" />
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="clan-kicker">Identidade do clube</span>
            </div>

            {isEditing ? (
              <div className="max-w-xl space-y-2.5">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do clube"
                  className="h-11 border-white/10 bg-black/25 text-lg font-semibold"
                />
                <Input
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Lema do clube"
                  className="border-white/10 bg-black/25 text-sm"
                />
              </div>
            ) : (
              <>
                <h1 className="clan-display truncate text-2xl text-foreground sm:text-4xl">{club.name}</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                  {club.motto || 'Define uma identidade que represente o teu clube dentro do universo.'}
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/75">
                  Clube criado em {new Date(club.created_at).toLocaleDateString('pt-PT')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 sm:self-start">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving} className="border border-white/[0.06] bg-black/20">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Check className="h-4 w-4" />
                Guardar
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="border-white/10 bg-black/20 hover:border-primary/25 hover:bg-primary/[0.06]">
              <Edit2 className="mr-1.5 h-4 w-4" />
              Editar identidade
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
