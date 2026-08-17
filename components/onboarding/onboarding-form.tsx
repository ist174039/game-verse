'use client'

import { useActionState, useState } from 'react'
import { Crown, Globe2, Shield } from 'lucide-react'
import type { Universe } from '@/lib/domain/core'
import { completeOnboardingAction, type OnboardingFormState } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initialState: OnboardingFormState={error:null}

export function OnboardingForm({universes}:{universes:Universe[]}) {
  const main=universes.find(u=>u.kind==='MAIN') ?? universes[0]
  const [selected,setSelected]=useState(main?.id ?? '')
  const [state,action,pending]=useActionState(completeOnboardingAction,initialState)

  return (
    <form action={action} className="space-y-7">
      <input type="hidden" name="universeId" value={selected} />

      <section>
        <div className="mb-4"><p className="clan-kicker">01 · Universo</p><h2 className="mt-1 text-xl font-bold">Onde começa a tua carreira?</h2><p className="mt-1 text-sm text-muted-foreground">Cada universo mantém clube, Silver, mercado e competições independentes.</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          {universes.map(universe=>{
            const active=selected===universe.id
            return <button key={universe.id} type="button" onClick={()=>setSelected(universe.id)} className={`min-h-28 rounded-2xl border p-4 text-left transition ${active?'border-primary/45 bg-primary/[0.07] shadow-[inset_0_0_0_1px_rgba(242,183,5,.08)]':'border-white/[0.07] bg-[#0b0b0b] hover:border-white/[0.14]'}`}>
              <div className="flex items-start justify-between gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${active?'border-primary/25 text-primary':'border-white/[0.07] text-muted-foreground'}`}>{universe.kind==='MAIN'?<Crown className="h-5 w-5"/>:<Globe2 className="h-5 w-5"/>}</span><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{universe.kind==='MAIN'?'Oficial':'Comunidade'}</span></div>
              <p className="mt-4 font-bold text-foreground">{universe.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{universe.description || 'Universo competitivo do Clã das Sombras.'}</p>
            </button>
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.05] text-primary"><Shield className="h-5 w-5"/></span><div><p className="clan-kicker">02 · Clube</p><h2 className="mt-1 text-xl font-bold">Cria a tua identidade</h2></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2"><span className="text-xs font-semibold text-foreground">Nome do clube</span><Input name="clubName" required minLength={3} maxLength={60} placeholder="Ex.: Sombras FC" autoComplete="off" /></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-foreground">Lema <span className="font-normal text-muted-foreground">(opcional)</span></span><Input name="motto" maxLength={120} placeholder="Uma frase que representa o clube" autoComplete="off" /></label>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Ao criar o clube, recebes automaticamente o Starting Silver definido pelas regras do universo. A operação é registada no ledger.</p>
      </section>

      {state.error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{state.error}</div>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" size="lg" disabled={!selected || pending} className="sm:min-w-44">{pending?'A criar clube…':'Criar clube'}</Button>
      </div>
    </form>
  )
}
