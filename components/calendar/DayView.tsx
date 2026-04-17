import type { CalendarEvent } from '@/types/calendar'
import { EventChip } from './EventChip'
import { isSameDay, format, parseISO } from '@/lib/utils/dateUtils'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: Date, hour?: number) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function DayView({ currentDate, events, onEventClick, onSlotClick }: DayViewProps) {
  const today = new Date()
  const isToday = isSameDay(currentDate, today)

  const dayEvents = events.filter(e => !e.all_day && isSameDay(parseISO(e.start_time), currentDate))
  const allDayEvents = events.filter(e => e.all_day && isSameDay(parseISO(e.start_time), currentDate))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200/60 px-4 py-3 flex items-center gap-3">
        <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold ${
          isToday ? 'bg-indigo-600 text-white' : 'text-gray-900'
        }`}>
          {format(currentDate, 'd')}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{format(currentDate, 'EEEE')}</div>
          <div className="text-xs text-gray-500">{format(currentDate, 'MMMM yyyy')}</div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200/60 px-4 py-1 space-y-0.5">
          {allDayEvents.map(event => (
            <EventChip key={event.id} event={event} onClick={onEventClick} compact />
          ))}
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid relative" style={{ gridTemplateColumns: '3rem 1fr' }}>
          {HOURS.map(hour => (
            <>
              <div key={`label-${hour}`} className="text-xs text-gray-400 text-right pr-2 h-16 flex items-start justify-end pt-0">
                {hour === 0 ? '' : `${String(hour).padStart(2, '0')}:00`}
              </div>
              <div
                key={`cell-${hour}`}
                className="border-l border-b border-gray-200/60 h-16 hover:bg-gray-50 cursor-pointer relative"
                onClick={() => onSlotClick(currentDate, hour)}
              >
                {dayEvents
                  .filter(e => new Date(e.start_time).getHours() === hour)
                  .map(event => {
                    const startMin = new Date(event.start_time).getMinutes()
                    const durationMs = new Date(event.end_time).getTime() - new Date(event.start_time).getTime()
                    const durationMin = Math.max(30, durationMs / 60000)
                    const topPct = (startMin / 60) * 100
                    const heightRem = (durationMin / 60) * 4
                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 z-10"
                        style={{ top: `${topPct}%`, height: `${heightRem}rem` }}
                      >
                        <EventChip event={event} onClick={onEventClick} />
                      </div>
                    )
                  })}
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
