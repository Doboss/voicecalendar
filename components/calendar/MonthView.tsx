import type { CalendarEvent } from '@/types/calendar'
import { EventChip } from './EventChip'
import { getMonthGrid, isSameDay, isSameMonth, format, parseISO } from '@/lib/utils/dateUtils'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: Date) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthView({ currentDate, events, onEventClick, onSlotClick }: MonthViewProps) {
  const weeks = getMonthGrid(currentDate)
  const today = new Date()

  function eventsForDay(day: Date) {
    return events.filter(e => isSameDay(parseISO(e.start_time), day))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 divide-x divide-y">
        {weeks.flatMap((week, wi) =>
          week.map((day, di) => {
            const dayEvents = eventsForDay(day)
            const isToday = isSameDay(day, today)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const MAX_VISIBLE = 3
            const overflow = dayEvents.length - MAX_VISIBLE

            return (
              <div
                key={`${wi}-${di}`}
                className={`min-h-[100px] p-1 cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                onClick={() => onSlotClick(day)}
              >
                <div className="flex justify-center mb-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, MAX_VISIBLE).map(event => (
                    <EventChip key={event.id} event={event} onClick={onEventClick} compact />
                  ))}
                  {overflow > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); onSlotClick(day) }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 pl-1"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
