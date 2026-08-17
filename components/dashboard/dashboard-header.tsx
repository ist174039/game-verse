import { Sparkles } from 'lucide-react'

interface DashboardHeaderProps {
  username: string
  isNewUser: boolean
}

export function DashboardHeader({ username, isNewUser }: DashboardHeaderProps) {
  const greeting = getGreeting()
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {username}!
        </h1>
        {isNewUser && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            New
          </span>
        )}
      </div>
      <p className="text-muted-foreground">
        Welcome to your football management dashboard
      </p>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
