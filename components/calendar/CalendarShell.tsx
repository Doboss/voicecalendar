'use client'

import { useState } from 'react'
import type { CalendarEvent, CreateEventInput, ModalState, ViewMode } from '@/types/calendar'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { EventModal } from './EventModal'
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format } from '@/lib/utils/dateUtils'

interface CalendarShellProps {
  events: CalendarEvent[]
  onCreate: (input: CreateEventInput) => Promise<CalendarEvent | null>
  onUpdate: (id: string, input: Partial<CreateEventInput>) => Promise<CalendarEvent | null>
  onDelete: (id: string) => Promise<boolean>
}

export function CalendarShell({ events, onCreate, onUpdate, onDelete }: CalendarShellProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalState, setModalState] = useState<ModalState>({ open: false, mode: 'create' })

  function navigatePrev() {
    if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1))
    else if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1))
    else setCurrentDate(d => subDays(d, 1))
  }

  function navigateNext() {
    if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1))
    else if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1))
    else setCurrentDate(d => addDays(d, 1))
  }

  function getHeaderTitle() {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy')
    if (viewMode === 'week') return `Week of ${format(currentDate, 'MMM d, yyyy')}`
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }

  function handleEventClick(event: CalendarEvent) {
    setModalState({ open: true, mode: 'edit', event })
  }

  function handleSlotClick(date: Date, hour?: number) {
    const d = new Date(date)
    if (hour !== undefined) d.setHours(hour, 0, 0, 0)
    setCurrentDate(date)
    setModalState({ open: true, mode: 'create', defaultDate: d })
  }

  const views: ViewMode[] = ['month', 'week', 'day']

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border rounded-md hover:bg-gray-50"
          >
            Today
          </button>
          <button onClick={navigatePrev} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
            &#8249;
          </button>
          <button onClick={navigateNext} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
            &#8250;
          </button>
          <span className="text-base font-semibold text-gray-900 ml-2">{getHeaderTitle()}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-md border overflow-hidden">
            {views.map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-sm font-medium capitalize ${
                  viewMode === v ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModalState({ open: true, mode: 'create', defaultDate: new Date() })}
            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            + New event
          </button>
        </div>
      </div>

      {/* View */}
      <div className="flex-1 overflow-hidden bg-white">
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      <EventModal
        state={modalState}
        onClose={() => setModalState(s => ({ ...s, open: false }))}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  )
}
