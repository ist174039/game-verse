'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight, Clock, Trophy, Swords, CalendarDays, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CalendarClientProps {
  userId: string
}

interface CalendarEvent {
  id: string
  title: string
  date: number
  type: 'match' | 'tournament' | 'deadline' | 'training' | 'transfer'
  time?: string
  status?: 'scheduled' | 'rescheduled' | 'pending'
}

const currentMonth = 'June 2025'
const daysInMonth = 30
const startDay = 0 // Sunday

const events: CalendarEvent[] = [
  { id: 'e1', title: 'CarloFC vs Eagles FC', date: 7, type: 'match', time: '18:00', status: 'scheduled' },
  { id: 'e2', title: 'Dragões vs United', date: 7, type: 'match', time: '20:00', status: 'scheduled' },
  { id: 'e3', title: 'Titans vs Stars', date: 8, type: 'match', time: '18:00', status: 'rescheduled' },
  { id: 'e4', title: 'Transfer Window Opens', date: 10, type: 'transfer' },
  { id: 'e5', title: 'Copa Verão Tournament', date: 12, type: 'tournament' },
  { id: 'e6', title: 'Training Session', date: 14, type: 'training', time: '16:00' },
  { id: 'e7', title: 'Winner J1 vs Winner J2', date: 15, type: 'match', time: '20:00', status: 'scheduled' },
  { id: 'e8', title: 'Squad Submission Deadline', date: 18, type: 'deadline' },
  { id: 'e9', title: 'Training Session', date: 19, type: 'training', time: '14:00' },
  { id: 'e10', title: 'Semi-Finals', date: 22, type: 'match', time: '18:00', status: 'pending' },
  { id: 'e11', title: 'Transfer Window Closes', date: 25, type: 'deadline' },
  { id: 'e12', title: 'Grand Final', date: 28, type: 'match', time: '20:00', status: 'pending' },
  { id: 'e13', title: 'Lions vs Phoenix', date: 9, type: 'match', time: '18:00', status: 'rescheduled' },
]

const typeStyles: Record<string, string> = {
  match: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  tournament: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  deadline: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  training: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  transfer: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
}

const typeIcons: Record<string, string> = {
  match: '⚽',
  tournament: '🏆',
  deadline: '⏰',
  training: '🏋️',
  transfer: '📋',
}

export function CalendarClient({ userId }: CalendarClientProps) {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(0)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: startDay }, (_, i) => null)

  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : []

  const upcomingEvents = events
    .filter((e) => e.date >= new Date().getDate())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-6 w-6 text-chart-4" />
          Calendar
        </h1>
        <p className="text-muted-foreground">View and manage your GameVerse schedule</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Calendar Grid */}
        <Card className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-bold text-foreground">{currentMonth}</h2>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const dayEvents = events.filter((e) => e.date === day)
              const hasMatch = dayEvents.some((e) => e.type === 'match')
              const isToday = day === new Date().getDate()

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg p-1.5 text-sm transition-colors hover:bg-secondary/50 aspect-square',
                    selectedDate === day && 'bg-primary/10 ring-1 ring-primary',
                    isToday && 'font-bold text-primary'
                  )}
                >
                  <span>{day}</span>
                  {hasMatch && (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                  {dayEvents.length > 1 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                      {dayEvents.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Events */}
          <Card className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">
              {selectedDate
                ? `Events — ${currentMonth} ${selectedDate}`
                : 'Select a date'}
            </h3>
            {selectedDate && selectedEvents.length === 0 && (
              <p className="text-xs text-muted-foreground">No events on this date</p>
            )}
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onReschedule={(e) => {
                    setSelectedEvent(e)
                    setShowRescheduleModal(true)
                  }}
                />
              ))}
            </div>
          </Card>

          {/* Upcoming */}
          <Card className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-chart-4" />
              Upcoming
            </h3>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          </Card>

          {/* Legend */}
          <Card className="p-3">
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { label: 'Match', color: 'bg-blue-500' },
                { label: 'Tournament', color: 'bg-purple-500' },
                { label: 'Deadline', color: 'bg-red-500' },
                { label: 'Training', color: 'bg-green-500' },
                { label: 'Transfer', color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Reschedule Match</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Swords className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{selectedEvent.title}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Current: {currentMonth} {selectedEvent.date}</span>
              </div>

              <div className="border-t border-border pt-3">
                <label className="text-xs text-muted-foreground">New Date</label>
                <select className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm">
                  <option value="">Select a date...</option>
                  <option value="10">June 10</option>
                  <option value="11">June 11</option>
                  <option value="12">June 12</option>
                  <option value="13">June 13</option>
                  <option value="14">June 14</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">New Time</label>
                <select className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm">
                  <option value="">Select a time...</option>
                  <option value="16:00">16:00</option>
                  <option value="18:00">18:00</option>
                  <option value="20:00">20:00</option>
                  <option value="22:00">22:00</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Reason (optional)</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm resize-none"
                  rows={2}
                  placeholder="Why are you rescheduling?"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowRescheduleModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => setShowRescheduleModal(false)}>
                <Check className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function EventCard({
  event,
  compact,
  onReschedule,
}: {
  event: CalendarEvent
  compact?: boolean
  onReschedule?: (e: CalendarEvent) => void
}) {
  return (
    <div className={`rounded-lg border ${typeStyles[event.type]} p-2.5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm flex-shrink-0">{typeIcons[event.type]}</span>
          <div className="min-w-0">
            <p className={`font-medium truncate text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
              {event.title}
            </p>
            {event.time && (
              <p className="text-[10px] opacity-70">{event.time}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {event.type === 'match' && event.status === 'rescheduled' && (
            <Badge variant="outline" className="text-[8px] px-1 border-amber-500 text-amber-600">
              Rescheduled
            </Badge>
          )}
          {event.type === 'match' && onReschedule && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onReschedule(event)}
            >
              <CalendarDays className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
