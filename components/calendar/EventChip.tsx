import type { CalendarEvent } from '@/types/calendar'
import { format, parseISO } from 'date-fns'

interface EventChipProps {
  event: CalendarEvent
  onClick: (event: CalendarEvent) => void
  compact?: boolean
}

const priorityDot: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
}

export function EventChip({ event, onClick, compact = false }: EventChipProps) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(event) }}
      className="w-full text-left truncate rounded px-1.5 py-0.5 text-xs font-medium text-white flex items-center gap-1 hover:opacity-80 transition-opacity"
      style={{ backgroundColor: event.color }}
      title={event.title}
    >
      <span
        className={`shrink-0 w-1.5 h-1.5 rounded-full ${priorityDot[event.priority] ?? 'bg-white/60'}`}
      />
      {!compact && !event.all_day && (
        <span className="shrink-0 opacity-80">
          {format(parseISO(event.start_time), 'HH:mm')}
        </span>
      )}
      <span className="truncate">{event.title}</span>
    </button>
  )
}
