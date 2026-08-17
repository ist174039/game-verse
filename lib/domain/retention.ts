import type { ISODateTime, UUID } from './core'

export type MissionCadence = 'DAILY' | 'WEEKLY' | 'SEASONAL' | 'ONE_TIME'
export type MissionState = 'ACTIVE' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED'

export interface MissionDefinition {
  id: UUID
  code: string
  title: string
  description: string
  cadence: MissionCadence
  target: number
  rewardBronze: number
  rewardManagerXp: number
  active: boolean
}

export interface UserMission {
  id: UUID
  userId: UUID
  missionId: UUID
  periodKey: string
  progress: number
  state: MissionState
  completedAt: ISODateTime | null
  claimedAt: ISODateTime | null
}

export interface AchievementDefinition {
  id: UUID
  code: string
  title: string
  description: string
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'LEGENDARY'
  rewardBronze: number
  rewardManagerXp: number
}

export interface UserAchievement {
  id: UUID
  userId: UUID
  achievementId: UUID
  unlockedAt: ISODateTime
}

export interface DailyRewardClaim {
  id: UUID
  userId: UUID
  claimDate: string
  streak: number
  rewardBronze: number
  rewardManagerXp: number
  claimedAt: ISODateTime
}

export interface BronzeStoreItem {
  id: UUID
  code: string
  name: string
  category: 'COSMETIC' | 'BADGE' | 'FRAME' | 'CLUB_CUSTOMIZATION' | 'COLLECTIBLE'
  priceBronze: number
  active: boolean
}
