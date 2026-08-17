import { Users, MessageCircle, Globe } from 'lucide-react'
import { FriendList } from './friend-list'
import { ActivityFeed } from './activity-feed'
import type { FriendWithProfile, ActivityWithUser } from '@/lib/types'

interface SocialPageClientProps {
  friends: FriendWithProfile[]
  pendingRequests: FriendWithProfile[]
  activities: ActivityWithUser[]
  userId: string
}

export function SocialPageClient({ friends, pendingRequests, activities, userId }: SocialPageClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-chart-4" />
            Social Hub
          </h1>
          <p className="text-muted-foreground">
            Connect with other managers and build your community
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Friends Column */}
        <div className="lg:col-span-3">
          <FriendList
            friends={friends}
            pendingRequests={pendingRequests}
            userId={userId}
          />
        </div>

        {/* Activity Column */}
        <div className="lg:col-span-2 space-y-4">
          <ActivityFeed activities={activities} />

          {/* Quick Stats */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-chart-3" />
              Community
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Friends</span>
                <span className="font-medium text-foreground">{friends.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Requests</span>
                <span className="font-medium text-accent">{pendingRequests.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Online Now</span>
                <span className="font-medium text-chart-3">—</span>
              </div>
            </div>
          </div>

          {/* Chat Rooms */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Chat Rooms
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                <Globe className="h-4 w-4 text-chart-3" />
                <div>
                  <p className="text-sm font-medium text-foreground">Global Chat</p>
                  <p className="text-xs text-muted-foreground">General discussion</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3 cursor-pointer hover:bg-secondary/50 transition-colors opacity-60">
                <MessageCircle className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">Tournament Chat</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
