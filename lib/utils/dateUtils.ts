import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  parseISO, startOfDay, endOfDay,
} from 'date-fns'

export {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  parseISO, startOfDay, endOfDay,
}

export function getMonthGrid(date: Date): Date[][] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}

export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toLocalDatetimeInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}
