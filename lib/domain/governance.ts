import type { ISODateTime, UUID } from './core'

export type InternalRole = 'super_admin' | 'platform_admin' | 'economy_admin' | 'competition_admin' | 'moderator' | 'support_agent' | 'finance_operator' | 'read_only_analyst'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'WAITING_INTERNAL' | 'RESOLVED' | 'CLOSED'
export type CaseStatus = 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'DISMISSED'

export interface SupportTicket {
  id: UUID
  requesterUserId: UUID | null
  clubId: UUID | null
  universeId: UUID | null
  category: 'PAYMENT' | 'ECONOMY' | 'MATCH' | 'MARKET' | 'ACCOUNT' | 'UNIVERSE' | 'MODERATION' | 'TECHNICAL' | 'OTHER'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
  status: TicketStatus
  subject: string
  description: string
  assignedAdminId: UUID | null
  metadata: Record<string, unknown>
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ModerationCase {
  id: UUID
  caseType: 'RESULT_DISPUTE' | 'SOCIAL_REPORT' | 'FRAUD' | 'APPEAL' | 'PAYMENT_RISK' | 'OTHER'
  status: CaseStatus
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reporterUserId: UUID | null
  targetUserId: UUID | null
  targetClubId: UUID | null
  targetUniverseId: UUID | null
  matchId: UUID | null
  assignedAdminId: UUID | null
  summary: string
  evidence: unknown[]
  signals: Record<string, unknown>
  resolution: Record<string, unknown> | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface AdminAuditLog {
  id: number
  actorUserId: UUID | null
  action: string
  targetType: string
  targetId: string | null
  oldState: unknown
  newState: unknown
  reason: string | null
  ticketId: string | null
  metadata: Record<string, unknown>
  createdAt: ISODateTime
}
