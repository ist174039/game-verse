'use client'

import { useState } from 'react'
import { UserPlus, User, Users, MessageCircle, Loader2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { FriendWithProfile } from '@/lib/types'

interface FriendListProps {
  friends: FriendWithProfile[]
  pendingRequests: FriendWithProfile[]
  userId: string
}

export function FriendList({ friends, pendingRequests, userId }: FriendListProps) {
  const [username, setUsername] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsAdding(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data: targetUser } = await supabase
        .from('user_profile')
        .select('id')
        .eq('username', username.trim())
        .single()

      if (!targetUser) {
        setError('User not found')
        setIsAdding(false)
        return
      }

      if (targetUser.id === userId) {
        setError("You can't add yourself!")
        setIsAdding(false)
        return
      }

      const { error: insertError } = await supabase
        .from('friend')
        .insert({ user_id: userId, friend_id: targetUser.id, status: 'pending' })

      if (insertError) throw insertError

      setUsername('')
      router.refresh()
    } catch {
      setError('Failed to add friend. They may already be your friend or have a pending request.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRespond = async (friendId: string, accept: boolean) => {
    const supabase = createClient()
    await supabase
      .from('friend')
      .update({ status: accept ? 'accepted' : 'blocked' })
      .eq('user_id', friendId)
      .eq('friend_id', userId)
    router.refresh()
  }

  const handleRemoveFriend = async (friendId: string) => {
    const supabase = createClient()
    await supabase
      .from('friend')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Friends</h2>
          <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            {friends.length}
          </span>
        </div>

        {/* Add Friend */}
        <form onSubmit={handleAddFriend} className="flex gap-2">
          <Input
            placeholder="Search by username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-input border-border flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isAdding || !username.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </form>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent" />
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-lg bg-secondary/30 p-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {req.friend?.username || 'Unknown'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 text-accent p-0"
                    onClick={() => handleRespond(req.friend_id, true)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 text-destructive p-0"
                    onClick={() => handleRespond(req.friend_id, false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="divide-y divide-border">
        {friends.length === 0 ? (
          <div className="p-8 text-center">
            <User className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No friends yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add friends by searching their username above
            </p>
          </div>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {friend.friend?.username || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>ELO: {friend.friend?.elo_rating || 1200}</span>
                    <span>·</span>
                    <span>Lvl {friend.friend?.prestige_level || 1}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => handleRemoveFriend(friend.friend_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
