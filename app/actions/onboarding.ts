'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { CreateClubInUniverseUseCase, JoinUniverseUseCase } from '@/lib/application/use-cases'

export interface OnboardingFormState {
  error: string | null
}

export async function completeOnboardingAction(_state: OnboardingFormState, formData: FormData): Promise<OnboardingFormState> {
  const supabase=await createClient()
  const { data:{user} }=await supabase.auth.getUser()
  if (!user) return {error:'Sessão inválida. Volta a iniciar sessão.'}

  const universeId=String(formData.get('universeId') ?? '')
  const name=String(formData.get('clubName') ?? '').trim()
  const motto=String(formData.get('motto') ?? '').trim()
  if (!universeId) return {error:'Escolhe um universo.'}
  if (name.length<3) return {error:'O nome do clube deve ter pelo menos 3 caracteres.'}

  const services=createApplicationServices(supabase)
  const universe=await services.universes.getById(universeId)
  if (!universe) return {error:'Universo não encontrado.'}

  try {
    const existing=await services.clubs.getForUserInUniverse(user.id,universe.id)
    if (!existing) {
      const join=new JoinUniverseUseCase(services.universes)
      await join.execute(universe)
      const createClub=new CreateClubInUniverseUseCase(services.universes)
      await createClub.execute({
        universe,
        name,
        motto:motto || null,
        idempotencyKey:`club-onboarding:${user.id}:${universe.id}`,
      })
    }
  } catch (error) {
    console.error('[onboarding]',error)
    const message=error instanceof Error ? error.message : 'onboarding_failed'
    const friendly:Record<string,string>={
      universe_not_joinable:'Este universo não está aberto a novas entradas.',
      universe_not_accepting_clubs:'Este universo não aceita novos clubes neste momento.',
      universe_requires_controlled_admission:'Este universo requer candidatura ou convite.',
      club_already_exists_in_universe:'Já tens um clube neste universo.',
    }
    return {error:friendly[message] ?? 'Não foi possível concluir a criação do clube. Tenta novamente.'}
  }

  redirect('/dashboard')
}
