import type { UUID } from '@/lib/domain/core'

export type MatchDisputeDecision = 'UPHOLD' | 'CORRECT_SCORE' | 'REPLAY'

export interface CompetitionAdminRepository {
  activate(input:{competitionId:UUID;actorUserId:UUID;startsAt?:string|null;roundIntervalDays?:number}):Promise<Record<string,unknown>>
  progress(input:{competitionId:UUID;actorUserId:UUID}):Promise<Record<string,unknown>>
  resolveDispute(input:{
    disputeId:UUID
    decision:MatchDisputeDecision
    resolution:string
    actorUserId:UUID
    idempotencyKey:string
    homeScore?:number|null
    awayScore?:number|null
  }):Promise<Record<string,unknown>>
}
