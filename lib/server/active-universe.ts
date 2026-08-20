import 'server-only'
import type { UniverseDirectoryReadModel } from '@/lib/application/read-models'

type DirectoryEntry=UniverseDirectoryReadModel['entries'][number]

export function resolveOwnedUniverseContext(entries:DirectoryEntry[],requestedUniverseId?:string|null){
  const requested=requestedUniverseId?entries.find(entry=>entry.universe.id===requestedUniverseId)??null:null
  if(requested&&!requested.club)return{selected:null,onboardingUniverseId:requested.universe.id}
  const selected=(requested?.club?requested:null)??entries.find(entry=>entry.club)??null
  return{selected,onboardingUniverseId:null as string|null}
}

export function onboardingHref(universeId?:string|null){return universeId?`/onboarding?universe=${encodeURIComponent(universeId)}`:'/onboarding'}
