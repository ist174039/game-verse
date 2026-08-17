import Link from 'next/link'
import { LogIn, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuestBannerProps {
  icon?: React.ReactNode
  title?: string
  description?: string
}

export function GuestBanner({
  icon,
  title = 'Sign in to access this feature',
  description = 'Create an account or sign in to play matches, join tournaments, and compete on the leaderboards.',
}: GuestBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-12 text-center">
      <div className="mb-4 text-amber-500">
        {icon || <Gamepad2 className="h-12 w-12" />}
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mb-6 max-w-md text-muted-foreground">{description}</p>
      <Link href="/auth/login">
        <Button className="bg-amber-500 text-white hover:bg-amber-600">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In / Register
        </Button>
      </Link>
    </div>
  )
}
