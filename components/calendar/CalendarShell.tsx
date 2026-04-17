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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-150"
          >
            Today
          </button>
          <button
            onClick={navigatePrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-150"
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={navigateNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-150"
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900 ml-1 hidden sm:block">{getHeaderTitle()}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {views.map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-medium capitalize rounded-md transition-all duration-150 ${
                  viewMode === v
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalState({ open: true, mode: 'create', defaultDate: new Date() })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors duration-150 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            <span className="hidden sm:inline">New event</span>
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
