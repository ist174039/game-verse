'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function PlatformLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const universeId = useSearchParams().get('universe')
  const href = universeId ? `/dashboard?universe=${encodeURIComponent(universeId)}` : '/dashboard'

  return <Link href={href} className={className}>{children}</Link>
}
