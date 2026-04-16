import type { CalendarEvent } from '@/types/calendar'
import { EventChip } from './EventChip'
import { getWeekDays, isSameDay, format, parseISO } from '@/lib/utils/dateUtils'

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: Date, hour?: number) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeekView({ currentDate, events, onEventClick, onSlotClick }: WeekViewProps) {
  const days = getWeekDays(currentDate)
  const today = new Date()

  function eventsForDay(day: Date) {
    return events.filter(e => !e.all_day && isSameDay(parseISO(e.start_time), day))
  }

  function allDayEventsForDay(day: Date) {
    return events.filter(e => e.all_day && isSameDay(parseISO(e.start_time), day))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="grid border-b" style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}>
        <div />
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={i} className="py-2 text-center border-l">
              <div className="text-xs text-gray-500 uppercase">{WEEKDAYS_SHORT[i]}</div>
              <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                isToday ? 'bg-indigo-600 text-white' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* All-day row */}
      <div className="grid border-b" style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}>
        <div className="text-xs text-gray-400 px-1 py-1 flex items-center">all day</div>
        {days.map((day, i) => (
          <div key={i} className="border-l min-h-[2rem] p-0.5 space-y-0.5">
            {allDayEventsForDay(day).map(event => (
              <EventChip key={event.id} event={event} onClick={onEventClick} compact />
            ))}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid relative" style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}>
          {HOURS.map(hour => (
            <>
              <div key={`label-${hour}`} className="text-xs text-gray-400 text-right pr-2 pt-0 h-14 flex items-start justify-end">
                {hour === 0 ? '' : `${String(hour).padStart(2, '0')}:00`}
              </div>
              {days.map((day, di) => (
                <div
                  key={`cell-${hour}-${di}`}
                  className="border-l border-b border-gray-100 h-14 hover:bg-gray-50 cursor-pointer relative"
                  onClick={() => onSlotClick(day, hour)}
                >
                  {eventsForDay(day)
                    .filter(e => new Date(e.start_time).getHours() === hour)
                    .map(event => {
                      const startMin = new Date(event.start_time).getMinutes()
                      const durationMs = new Date(event.end_time).getTime() - new Date(event.start_time).getTime()
                      const durationMin = Math.max(30, durationMs / 60000)
                      const topPct = (startMin / 60) * 100
                      const heightRem = (durationMin / 60) * 3.5
                      return (
                        <div
                          key={event.id}
                          className="absolute left-0.5 right-0.5 z-10"
                          style={{ top: `${topPct}%`, height: `${heightRem}rem` }}
                        >
                          <EventChip event={event} onClick={onEventClick} />
                        </div>
                      )
                    })}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
