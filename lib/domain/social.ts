import type { ISODateTime, UUID } from './core'

export type CommunityVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY' | 'APPROVAL_REQUIRED'
export type CommunityRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'

export interface Community {
  id: UUID
  ownerUserId: UUID
  name: string
  slug: string
  description: string | null
  visibility: CommunityVisibility
  createdAt: ISODateTime
}

export interface CommunityMembership {
  communityId: UUID
  userId: UUID
  role: CommunityRole
  joinedAt: ISODateTime
}

export interface Follow {
  followerId: UUID
  followedId: UUID
  createdAt: ISODateTime
}

export interface Friendship {
  userA: UUID
  userB: UUID
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  createdAt: ISODateTime
}

export interface CommunityPost {
  id: UUID
  communityId: UUID
  authorUserId: UUID
  body: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface DirectConversation {
  id: UUID
  participantA: UUID
  participantB: UUID
  createdAt: ISODateTime
}

export interface ChatMessage {
  id: UUID
  conversationId: UUID
  senderUserId: UUID
  body: string
  createdAt: ISODateTime
}
