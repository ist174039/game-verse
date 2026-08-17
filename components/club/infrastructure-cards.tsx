'use client'

import { useState } from 'react'
import { Building2, GraduationCap, Dumbbell, Megaphone, Landmark, Lock, ArrowUp, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ClubInfrastructure, InfrastructureCardType } from '@/lib/types'

interface InfrastructureCardsProps {
  infrastructure: ClubInfrastructure[]
  clubId: string
  balance: number
}

const INFRASTRUCTURE_CONFIG: Record<InfrastructureCardType, {
  name: string
  description: string
  icon: React.ReactNode
  bonusType: string
  baseCost: number
}> = {
  stadium: {
    name: 'Stadium',
    description: 'Increase match earnings',
    icon: <Building2 className="h-6 w-6" />,
    bonusType: 'Match Bonus',
    baseCost: 500,
  },
  academy: {
    name: 'Academy',
    description: 'Develop young talent faster',
    icon: <GraduationCap className="h-6 w-6" />,
    bonusType: 'XP Bonus',
    baseCost: 400,
  },
  training: {
    name: 'Training Center',
    description: 'Boost player performance',
    icon: <Dumbbell className="h-6 w-6" />,
    bonusType: 'Stats Bonus',
    baseCost: 450,
  },
  marketing: {
    name: 'Marketing',
    description: 'Earn passive income',
    icon: <Megaphone className="h-6 w-6" />,
    bonusType: 'Passive Income',
    baseCost: 600,
  },
  finance: {
    name: 'Finance Office',
    description: 'Reduce transaction fees',
    icon: <Landmark className="h-6 w-6" />,
    bonusType: 'Fee Reduction',
    baseCost: 550,
  },
}

const CARD_TYPES: InfrastructureCardType[] = ['stadium', 'academy', 'training', 'marketing', 'finance']

export function InfrastructureCards({ infrastructure, clubId, balance }: InfrastructureCardsProps) {
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const router = useRouter()

  const getCardData = (type: InfrastructureCardType) => {
    return infrastructure.find(i => i.card_type === type)
  }

  const getUpgradeCost = (type: InfrastructureCardType, currentLevel: number) => {
    const base = INFRASTRUCTURE_CONFIG[type].baseCost
    return Math.round(base * Math.pow(1.5, currentLevel))
  }

  const getBonusPercentage = (level: number) => {
    return level * 5 // 5% per level
  }

  const handleUpgrade = async (type: InfrastructureCardType) => {
    const card = getCardData(type)
    const currentLevel = card?.level || 0
    const cost = getUpgradeCost(type, currentLevel)

    if (balance < cost) return

    setUpgrading(type)
    const supabase = createClient()

    if (card) {
      // Upgrade existing card
      const { error } = await supabase
        .from('club_infrastructure')
        .update({ 
          level: currentLevel + 1,
          bonus_pct: getBonusPercentage(currentLevel + 1) / 100,
        })
        .eq('id', card.id)

      if (!error) {
        // Deduct cost from wallet
        await supabase.rpc('deduct_balance', { 
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          p_amount: cost 
        })
      }
    } else {
      // Create new card
      const { error } = await supabase
        .from('club_infrastructure')
        .insert({
          club_id: clubId,
          card_type: type,
          level: 1,
          bonus_pct: 0.05,
        })

      if (!error) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('wallet')
            .update({ balance: balance - cost })
            .eq('user_id', user.id)
        }
      }
    }

    setUpgrading(null)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="font-semibold text-foreground">Club Infrastructure</h2>
          <p className="text-sm text-muted-foreground">Upgrade your facilities to gain bonuses</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{balance.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">GC</span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_TYPES.map((type) => {
          const config = INFRASTRUCTURE_CONFIG[type]
          const card = getCardData(type)
          const level = card?.level || 0
          const isMaxLevel = level >= 5
          const upgradeCost = getUpgradeCost(type, level)
          const canAfford = balance >= upgradeCost
          const isUpgrading = upgrading === type

          return (
            <div
              key={type}
              className={`rounded-xl border p-4 transition-colors ${
                level > 0 
                  ? 'border-primary/30 bg-primary/5' 
                  : 'border-border bg-secondary/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-lg p-2 ${
                  level > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  {config.icon}
                </div>
                {level > 0 && (
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                    Lvl {level}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-foreground">{config.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>

              {level > 0 && (
                <div className="mt-3 rounded bg-secondary/50 px-2 py-1.5">
                  <span className="text-xs text-muted-foreground">{config.bonusType}: </span>
                  <span className="text-sm font-medium text-accent">+{getBonusPercentage(level)}%</span>
                </div>
              )}

              <div className="mt-4">
                {isMaxLevel ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-accent/10 py-2 text-sm text-accent">
                    <Lock className="h-4 w-4" />
                    <span>Max Level</span>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant={canAfford ? 'default' : 'outline'}
                    disabled={!canAfford || isUpgrading}
                    onClick={() => handleUpgrade(type)}
                  >
                    {isUpgrading ? (
                      'Upgrading...'
                    ) : (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        {level === 0 ? 'Unlock' : 'Upgrade'} ({upgradeCost.toLocaleString()} GC)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
