import type { ISODateTime, UUID } from './core'

export type DomainEventType =
  | 'MATCH_SETTLED'
  | 'MATCH_DISPUTED'
  | 'TRANSFER_COMPLETED'
  | 'AUCTION_COMPLETED'
  | 'PLAYER_DATA_UPDATED'
  | 'COMPETITION_COMPLETED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'FINANCIAL_WARNING'

export interface DomainEvent {
  id: UUID
  universeId: UUID | null
  clubId: UUID | null
  userId: UUID | null
  type: DomainEventType | string
  aggregateType: string
  aggregateId: UUID | null
  payload: Record<string, unknown>
  occurredAt: ISODateTime
  processedAt: ISODateTime | null
}

export interface JournalArticle {
  id: UUID
  universeId: UUID | null
  eventId: UUID | null
  category: string
  title: string
  summary: string
  body: string | null
  importance: number
  publishedAt: ISODateTime
}

export interface Notification {
  id: UUID
  userId: UUID
  type: string
  title: string
  body: string
  href: string | null
  readAt: ISODateTime | null
  createdAt: ISODateTime
}

export interface Conversation {
  id: UUID
  kind: 'DIRECT' | 'GROUP' | 'COMMUNITY'
  communityId: UUID | null
  title: string | null
  createdAt: ISODateTime
}

export interface Message {
  id: UUID
  conversationId: UUID
  senderUserId: UUID
  body: string
  createdAt: ISODateTime
  editedAt: ISODateTime | null
  deletedAt: ISODateTime | null
}
