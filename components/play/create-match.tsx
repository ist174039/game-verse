'use client'

import { useState } from 'react'
import { Gamepad2, Sword, Users, Loader2, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CreateMatchProps {
  userId: string
  eloRating: number
  balance: number
}

export function CreateMatch({ userId, eloRating, balance }: CreateMatchProps) {
  const [matchType, setMatchType] = useState<'casual' | 'ranked'>('casual')
  const [opponentUsername, setOpponentUsername] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    const supabase = createClient()

    try {
      // Find opponent by username
      const { data: opponent, error: opponentError } = await supabase
        .from('user_profile')
        .select('id, elo_rating')
        .eq('username', opponentUsername.trim())
        .single()

      if (opponentError || !opponent) {
        setError('Opponent not found. Check the username and try again.')
        setIsCreating(false)
        return
      }

      if (opponent.id === userId) {
        setError('You cannot play against yourself!')
        setIsCreating(false)
        return
      }

      const { error: matchError } = await supabase
        .from('match')
        .insert({
          creator_id: userId,
          opponent_id: opponent.id,
          match_type: matchType,
          state: 'CREATED',
        })

      if (matchError) throw matchError

      setOpponentUsername('')
      router.refresh()
    } catch {
      setError('Failed to create match. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleQuickMatch = async () => {
    setIsCreating(true)
    setError(null)

    const supabase = createClient()

    try {
      // Find a random opponent with similar ELO (simplified: any available player)
      const { data: opponents, error: findError } = await supabase
        .from('user_profile')
        .select('id')
        .neq('id', userId)
        .limit(1)

      if (findError || !opponents || opponents.length === 0) {
        setError('No opponents available right now. Try inviting a specific player.')
        setIsCreating(false)
        return
      }

      const { error: matchError } = await supabase
        .from('match')
        .insert({
          creator_id: userId,
          opponent_id: opponents[0].id,
          match_type: matchType,
          state: 'CREATED',
        })

      if (matchError) throw matchError

      router.refresh()
    } catch {
      setError('Failed to find a match. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="overflow-hidden border-border">
      <div className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Create Match</h2>
            <p className="text-sm text-muted-foreground">
              Your ELO: {eloRating} | Balance: {balance.toLocaleString()} GC
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <Label className="text-foreground mb-3 block">Match Type</Label>
          <Tabs
            value={matchType}
            onValueChange={(v) => setMatchType(v as 'casual' | 'ranked')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="casual" className="flex items-center gap-2">
                <Sword className="h-4 w-4" />
                Casual (K=16)
              </TabsTrigger>
              <TabsTrigger value="ranked" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Ranked (K=32)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="rounded-lg bg-secondary/30 p-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Rewards Preview</h3>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-md bg-accent/10 p-2">
              <p className="font-medium text-accent">Win</p>
              <p className="text-muted-foreground">+50 GC</p>
            </div>
            <div className="rounded-md bg-chart-3/10 p-2">
              <p className="font-medium text-chart-3">Draw</p>
              <p className="text-muted-foreground">+25 GC</p>
            </div>
            <div className="rounded-md bg-destructive/10 p-2">
              <p className="font-medium text-destructive">Loss</p>
              <p className="text-muted-foreground">+10 GC</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            +0-20% infrastructure bonus (Stadium/Academy)
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="opponent" className="text-foreground">Opponent Username</Label>
          <div className="flex gap-2">
            <Input
              id="opponent"
              placeholder="Enter username..."
              value={opponentUsername}
              onChange={(e) => setOpponentUsername(e.target.value)}
              className="bg-input border-border flex-1"
            />
            <Button
              onClick={handleCreateMatch}
              disabled={isCreating || !opponentUsername.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5"
          onClick={handleQuickMatch}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Coins className="h-4 w-4 mr-2" />
          )}
          Quick Match — Find Random Opponent
        </Button>
      </div>
    </Card>
  )
}
