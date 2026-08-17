import { Activity, Swords, Trophy, Store, Award, User } from 'lucide-react'
import type { ActivityWithUser } from '@/lib/types'

interface ActivityFeedProps {
  activities: ActivityWithUser[]
}

const activityIcons: Record<string, React.ReactNode> = {
  match: <Swords className="h-4 w-4 text-accent" />,
  tournament: <Trophy className="h-4 w-4 text-primary" />,
  achievement: <Award className="h-4 w-4 text-chart-3" />,
  market: <Store className="h-4 w-4 text-chart-4" />,
  social: <User className="h-4 w-4 text-blue-500" />,
}

const activityColors: Record<string, string> = {
  match: 'bg-accent/10',
  tournament: 'bg-primary/10',
  achievement: 'bg-chart-3/10',
  market: 'bg-chart-4/10',
  social: 'bg-blue-500/10',
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-chart-3" />
          <h2 className="font-semibold text-foreground">Activity Feed</h2>
        </div>
      </div>

      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activity from your friends and network will appear here
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-secondary/20 transition-colors">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                  activityColors[activity.type] || 'bg-secondary'
                }`}
              >
                {activityIcons[activity.type] || <Activity className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{activity.user?.username || 'Someone'}</span>
                  {' '}
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(activity.created_at).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
