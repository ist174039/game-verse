import { BarChart3 } from 'lucide-react'

export function RankingsHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rankings</h1>
        <p className="text-muted-foreground">See how you stack up against other managers</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-foreground">Season 1</span>
      </div>
    </div>
  )
}
