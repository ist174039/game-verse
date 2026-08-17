'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  AlertTriangle,
  Settings,
  Sparkles,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MatchItem {
  id: string
  home: string
  away: string
  date: string | null
  time: string | null
  status: 'scheduled' | 'reschedule' | 'pending' | 'unscheduled'
  phase: string
}

const MATCHES: MatchItem[] = [
  { id: 'm1', home: 'CarloFC', away: 'Eagles FC', date: '07 Jun', time: '18:00', status: 'scheduled', phase: 'Round of 16' },
  { id: 'm2', home: 'Dragões', away: 'United', date: '07 Jun', time: '20:00', status: 'scheduled', phase: 'Round of 16' },
  { id: 'm3', home: 'Titans', away: 'Stars', date: '08 Jun', time: '18:00', status: 'reschedule', phase: 'Round of 16' },
  { id: 'm4', home: 'Lions', away: 'Phoenix', date: null, time: null, status: 'unscheduled', phase: 'Round of 16' },
  { id: 'm5', home: 'Winner J1', away: 'Winner J2', date: '10 Jun', time: '20:00', status: 'scheduled', phase: 'Quarter-Finals' },
  { id: 'm6', home: 'Winner J3', away: 'Winner J4', date: null, time: null, status: 'pending', phase: 'Quarter-Finals' },
]

const RESCHEDULE_REQUESTS = [
  { match: 'Titans vs Stars', original: '08 Jun, 18:00', newDate: '09 Jun, 20:00', requester: 'Titans', reason: 'Conflict with another tournament' },
  { match: 'Lions vs Phoenix', original: '—', newDate: '09 Jun, 18:00', requester: 'Lions', reason: 'Player availability' },
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Calendar grid data for June 2026
const CALENDAR_WEEKS = [
  [
    { day: 1, hasEvent: false, phase: '' },
    { day: 2, hasEvent: false, phase: '' },
    { day: 3, hasEvent: false, phase: '' },
    { day: 4, hasEvent: true, phase: '4 jogos', isToday: false, isHighlighted: true },
    { day: 5, hasEvent: false, phase: '' },
    { day: 6, hasEvent: true, phase: '2 jogos', isToday: false, isRed: true },
    { day: 7, hasEvent: true, phase: 'Round of 16', isToday: false, isGreen: true },
  ],
  [
    { day: 8, hasEvent: true, phase: 'Round of 16', isToday: false, isGreen: true },
    { day: 9, hasEvent: false, phase: '' },
    { day: 10, hasEvent: true, phase: 'Quarter-Finals', isToday: false, isGreen: true },
    { day: 11, hasEvent: false, phase: '' },
    { day: 12, hasEvent: false, phase: '' },
    { day: 13, hasEvent: true, phase: 'Semi-Final', isToday: false, isGreen: true },
    { day: 14, hasEvent: true, phase: '🏆 Final', isToday: true, isRed: true },
  ],
  [
    { day: 15, hasEvent: false, phase: '' },
    { day: 16, hasEvent: false, phase: '' },
    { day: 17, hasEvent: false, phase: '' },
    { day: 18, hasEvent: false, phase: '' },
    { day: 19, hasEvent: false, phase: '' },
    { day: 20, hasEvent: false, phase: '' },
    { day: 21, hasEvent: false, phase: '' },
  ],
]

function StatusBadge({ status }: { status: MatchItem['status'] }) {
  switch (status) {
    case 'scheduled':
      return <Badge className="bg-green-100 text-green-700 text-[10px] dark:bg-green-900/30 dark:text-green-400">Scheduled</Badge>
    case 'reschedule':
      return <Badge className="bg-blue-100 text-blue-700 text-[10px] dark:bg-blue-900/30 dark:text-blue-400">🔄 Reschedule</Badge>
    case 'unscheduled':
      return <Badge className="bg-red-100 text-red-700 text-[10px] dark:bg-red-900/30 dark:text-red-400">⏳ Unscheduled</Badge>
    case 'pending':
      return <Badge variant="secondary" className="text-[10px]">⏳ Pending</Badge>
  }
}

export function CreatorCalendarClient() {
  const [selectedTournament, setSelectedTournament] = useState('Copa GameVerse Semanal')
  const [selectedPhase, setSelectedPhase] = useState('all')

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/tournaments"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Creator&apos;s Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Match scheduling for your tournaments
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">3</p>
            <p className="text-xs text-muted-foreground">Active Tournaments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">48</p>
            <p className="text-xs text-muted-foreground">Scheduled Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">12</p>
            <p className="text-xs text-muted-foreground">Played Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">4</p>
            <p className="text-xs text-muted-foreground">Unscheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">2</p>
            <p className="text-xs text-muted-foreground">Reschedule Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Selector */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-sm">
              🏟️
            </div>
            <h2 className="text-sm font-bold text-emerald-500">Select Tournament</h2>
          </div>
          <Badge className="bg-amber-500 text-white">Organizer: CarloFC</Badge>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Tournament</p>
              <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 text-sm">
                <span>🏆 {selectedTournament}</span>
                <span className="text-xs text-muted-foreground">16 players · Knockout</span>
              </div>
            </div>
            <div className="min-w-[140px] flex-1">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Phase</p>
              <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm">
                <Calendar className="h-4 w-4" />
                All Phases
              </div>
            </div>
            <div className="flex gap-2 self-end pb-0.5">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Calendar
              </Button>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Manual Match
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar + Match List */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Calendar Mini */}
        <Card className="flex-1">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-bold text-foreground">📅 June 2026</h3>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <CardContent className="p-3">
            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1 text-center text-[10px] font-bold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            {/* Weeks */}
            {CALENDAR_WEEKS.map((week, wi) => (
              <div key={wi} className="mb-0.5 grid grid-cols-7 gap-0.5">
                {week.map((day) => (
                  <div
                    key={day.day}
                    className={cn(
                      'min-h-[44px] rounded border p-1 text-right text-[10px] transition-colors',
                      day.isToday
                        ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                        : day.isGreen
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                        : day.isRed
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                        : day.isHighlighted
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
                        : 'border-border bg-card'
                    )}
                  >
                    <span
                      className={cn(
                        day.isToday ? 'font-bold text-amber-600' : 'text-muted-foreground'
                      )}
                    >
                      {day.day}
                    </span>
                    {day.phase && (
                      <div
                        className={cn(
                          'mt-0.5 rounded px-0.5 text-center text-[7px] font-semibold leading-tight',
                          day.isGreen ? 'text-green-700 dark:text-green-400' : day.isRed ? 'text-red-600' : 'text-amber-600'
                        )}
                      >
                        {day.phase}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-3 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm border border-red-200 bg-red-50" /> Matches today
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm border border-green-200 bg-green-50" /> Active phase
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm border-2 border-amber-500 bg-amber-50" /> Today
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Match List by Phase */}
        <Card className="flex-[2]">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-bold text-foreground">📋 Matches — {selectedTournament}</h3>
            <Badge className="bg-amber-500 text-white text-[10px]">16 matches · 4 phases</Badge>
          </div>
          <CardContent className="p-2">
            {/* Group by Phase */}
            {['Round of 16', 'Quarter-Finals'].map((phase) => {
              const phaseMatches = MATCHES.filter((m) => m.phase === phase)
              const count = phaseMatches.length
              return (
                <div key={phase}>
                  <div className="mt-2 border-b px-2 pb-1 pt-3 text-xs font-bold text-amber-500">
                    🏟️ {phase} — {count} matches
                  </div>
                  {phaseMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 border-b px-2 py-2 last:border-0"
                    >
                      <div
                        className={cn(
                          'h-7 w-0.5 shrink-0 rounded-full',
                          match.status === 'scheduled'
                            ? 'bg-green-500'
                            : match.status === 'reschedule'
                            ? 'bg-blue-500'
                            : match.status === 'unscheduled'
                            ? 'bg-amber-500'
                            : 'bg-gray-300'
                        )}
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-medium text-foreground">{match.home}</span>
                        <span className="text-muted-foreground"> vs </span>
                        <span className="font-medium text-foreground">{match.away}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {match.date && match.time ? `${match.date}, ${match.time}` : '—'}
                      </div>
                      <StatusBadge status={match.status} />
                      {match.status === 'unscheduled' ? (
                        <Button variant="default" size="sm" className="h-6 w-6 p-0">
                          <Calendar className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                          ✏️
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Auto Generate Calendar */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-sm font-bold text-foreground">
            ⚡ Generate Auto Calendar
          </h3>
          <Badge className="bg-amber-500 text-white">Smart Scheduling</Badge>
        </div>
        <CardContent className="p-6">
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">📅 Start Date</p>
              <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm">
                <Calendar className="h-4 w-4" />
                07/06/2026
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">⏰ Interval Between Matches</p>
              <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm">
                <Clock className="h-4 w-4" />
                2 hours
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">🌙 Night Games</p>
              <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm">
                <span>🌙</span>
                Until 23:00
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Full Calendar
            </Button>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <div className="ml-auto flex flex-wrap gap-4 text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="h-3 w-3" />
                Avoid time conflicts
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="h-3 w-3" />
                Respect min interval (4h)
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="h-3 w-3" />
                Alternating days
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              The algorithm distributes matches evenly across phases, respecting player availability and avoiding overlaps with other tournaments.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reschedule Requests */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-sm font-bold text-foreground">
            📨 Reschedule Requests
          </h3>
          <Badge className="bg-red-500 text-white">2 pending</Badge>
        </div>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Match</th>
                  <th className="pb-2 font-medium">Original Date</th>
                  <th className="pb-2 font-medium">New Date</th>
                  <th className="pb-2 font-medium">Requested By</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {RESCHEDULE_REQUESTS.map((req, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 font-medium text-foreground">{req.match}</td>
                    <td className="py-2 text-muted-foreground">{req.original}</td>
                    <td className="py-2 text-foreground">{req.newDate}</td>
                    <td className="py-2">{req.requester}</td>
                    <td className="py-2 text-muted-foreground">{req.reason}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 w-6 p-0">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Rules */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-sm font-bold text-foreground">
            📋 Tournament Scheduling Rules
          </h3>
          <Badge className="bg-amber-500 text-white">Configurable</Badge>
        </div>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 text-sm font-semibold text-foreground">⏱️ Time Between Matches</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Min:</span>
                <span className="rounded border bg-card px-2 py-1 font-medium">4 hours</span>
                <span className="text-muted-foreground">Max per day:</span>
                <span className="rounded border bg-card px-2 py-1 font-medium">2 matches</span>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 text-sm font-semibold text-foreground">📅 Game Window</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded border bg-card px-2 py-1 font-medium">08:00 - 23:00</span>
                <span className="text-muted-foreground">Allowed days:</span>
                <span className="rounded border bg-card px-2 py-1 font-medium">Mon-Sat</span>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 text-sm font-semibold text-foreground">🔄 Rescheduling</h4>
              <p className="text-xs text-muted-foreground">
                Max <strong>2</strong> reschedules per match &middot; Creator approval required &middot; Auto notification to all parties
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 text-sm font-semibold text-foreground">🔔 Notifications</h4>
              <p className="text-xs text-muted-foreground">
                24h reminder &middot; 1h alert &middot; Reschedule notification &middot; Attendance confirmation (12h before)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
