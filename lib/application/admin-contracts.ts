import type { UUID } from '@/lib/domain/core'

export interface CompetitionAdminRepository {
  activate(input:{competitionId:UUID;actorUserId:UUID;startsAt?:string|null;roundIntervalDays?:number}):Promise<Record<string,unknown>>
  progress(input:{competitionId:UUID;actorUserId:UUID}):Promise<Record<string,unknown>>
}
