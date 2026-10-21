'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRoundPlus, UserRoundCheck, UserRoundX, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FriendshipState = 'NONE' | 'OUTGOING' | 'INCOMING' | 'ACCEPTED'

export function ProfileSocialActions({ targetUserId, initiallyFollowing, friendship }: {
  targetUserId: string
  initiallyFollowing: boolean
  friendship: FriendshipState
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initiallyFollowing)
  const [friendState, setFriendState] = useState(friendship)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function request(url: string, method: string, body: Record<string, unknown>) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'social_operation_failed')
      return true
    } catch {
      setError('Não foi possível atualizar a relação. Tenta novamente.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function toggleFollow() {
    const method = following ? 'DELETE' : 'POST'
    if (await request('/api/social/follow', method, { user_id: targetUserId })) {
      setFollowing(value => !value)
      router.refresh()
    }
  }

  async function requestFriendship() {
    if (await request('/api/social/friends/request', 'POST', { friend_id: targetUserId })) {
      setFriendState('OUTGOING')
      router.refresh()
    }
  }

  async function respond(action: 'accepted' | 'rejected') {
    if (await request('/api/social/friends/respond', 'PUT', { friendship_id: targetUserId, action })) {
      setFriendState(action === 'accepted' ? 'ACCEPTED' : 'NONE')
      router.refresh()
    }
  }

  async function removeFriend() {
    if (await request('/api/social/friends/remove', 'DELETE', { friend_id: targetUserId })) {
      setFriendState('NONE')
      router.refresh()
    }
  }

  return <div className="flex flex-wrap gap-2">
    <Button variant={following ? 'outline' : 'secondary'} disabled={loading} onClick={() => void toggleFollow()}>
      {following ? <UserRoundCheck aria-hidden="true" /> : <UserRoundPlus aria-hidden="true" />}{following ? 'A seguir' : 'Seguir'}
    </Button>
    {friendState === 'NONE' ? <Button variant="outline" disabled={loading} onClick={() => void requestFriendship()}><UserRoundPlus aria-hidden="true"/>Adicionar amigo</Button> : null}
    {friendState === 'OUTGOING' ? <Button variant="outline" disabled><UserRoundCheck aria-hidden="true"/>Pedido enviado</Button> : null}
    {friendState === 'INCOMING' ? <><Button disabled={loading} onClick={() => void respond('accepted')}><UserRoundCheck aria-hidden="true"/>Aceitar</Button><Button variant="outline" disabled={loading} onClick={() => void respond('rejected')}><UserRoundX aria-hidden="true"/>Recusar</Button></> : null}
    {friendState === 'ACCEPTED' ? <Button variant="outline" disabled={loading} onClick={() => void removeFriend()}><UserMinus aria-hidden="true"/>Remover amigo</Button> : null}
    {error ? <p role="alert" className="w-full text-xs text-destructive">{error}</p> : null}
  </div>
}
