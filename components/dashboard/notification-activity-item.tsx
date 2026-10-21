'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function NotificationActivityItem({
  id,
  href,
  unread,
  className,
  children,
}: {
  id: string
  href: string | null
  unread: boolean
  className: string
  children: ReactNode
}) {
  const router = useRouter()
  const [error, setError] = useState(false)
  const [read, setRead] = useState(!unread)
  const safeHref = href?.startsWith('/') && !href.startsWith('//') ? href : null

  async function markRead() {
    if (read) return true
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
      if (!response.ok) throw new Error('mark_read_failed')
      setRead(true)
      if (!safeHref) router.refresh()
      return true
    } catch {
      setError(true)
      return false
    }
  }

  if (safeHref) {
    return <Link href={safeHref} className={className} onClick={async event => {
      if (!read) {
        event.preventDefault()
        if (await markRead()) router.push(safeHref)
      }
    }}>{children}{error ? <span className="text-[10px] text-destructive">Não foi possível marcar como lida.</span> : null}</Link>
  }

  return <button type="button" className={`${className} w-full text-left disabled:cursor-default`} disabled={read} onClick={() => void markRead()} aria-label={!read ? 'Marcar notificação como lida' : undefined}>
    {children}
    {error ? <span className="text-[10px] text-destructive">Não foi possível marcar como lida.</span> : null}
  </button>
}
