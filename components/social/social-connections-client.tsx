'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus, UserRoundCheck, UserRoundX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SocialConnectionsClient({ targetUserId, action }: { targetUserId: string; action: 'incoming' | 'friend' | 'following' | 'profile' | 'outgoing' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function update(url: string, method: string, body: Record<string, unknown>) {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!response.ok) throw new Error('social_update_failed')
      router.refresh()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (action === 'profile') return null
  if (action === 'outgoing') return <span className="text-xs text-muted-foreground">Pendente</span>
  if (action === 'incoming') return <div className="flex gap-2"><Button size="sm" disabled={loading} aria-label="Aceitar pedido de amizade" onClick={() => void update('/api/social/friends/respond','PUT',{friendship_id:targetUserId,action:'accepted'})}><UserRoundCheck aria-hidden="true"/>Aceitar</Button><Button size="sm" variant="outline" disabled={loading} aria-label="Recusar pedido de amizade" onClick={() => void update('/api/social/friends/respond','PUT',{friendship_id:targetUserId,action:'rejected'})}><UserRoundX aria-hidden="true"/>Recusar</Button>{error?<span role="alert" className="sr-only">Não foi possível atualizar o pedido.</span>:null}</div>
  const isFriend = action === 'friend'
  return <div className="flex flex-col items-end gap-1"><Button size="sm" variant="outline" disabled={loading} aria-label={isFriend ? 'Remover amigo' : 'Deixar de seguir'} onClick={() => void update(isFriend?'/api/social/friends/remove':'/api/social/follow',isFriend?'DELETE':'DELETE',isFriend?{friend_id:targetUserId}:{user_id:targetUserId})}><UserMinus aria-hidden="true"/>{isFriend?'Remover':'Deixar de seguir'}</Button>{error?<span role="alert" className="text-[10px] text-destructive">Falha ao atualizar.</span>:null}</div>
}
