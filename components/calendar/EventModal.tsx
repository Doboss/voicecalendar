'use client'

import { useEffect, useState } from 'react'
import type { CalendarEvent, CreateEventInput, ModalState, Priority } from '@/types/calendar'
import { toLocalDatetimeInput } from '@/lib/utils/dateUtils'

const COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280']

interface EventModalProps {
  state: ModalState
  onClose: () => void
  onCreate: (input: CreateEventInput) => Promise<CalendarEvent | null>
  onUpdate: (id: string, input: Partial<CreateEventInput>) => Promise<CalendarEvent | null>
  onDelete: (id: string) => Promise<boolean>
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-150'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5'

export function EventModal({ state, onClose, onCreate, onUpdate, onDelete }: EventModalProps) {
  const { open, mode, event, defaultDate } = state
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [color, setColor] = useState('#4F46E5')
  const [priority, setPriority] = useState<Priority>('medium')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && event) {
      setTitle(event.title)
      setStartTime(toLocalDatetimeInput(new Date(event.start_time)))
      setEndTime(toLocalDatetimeInput(new Date(event.end_time)))
      setAllDay(event.all_day)
      setDescription(event.description ?? '')
      setLocation(event.location ?? '')
      setColor(event.color)
      setPriority(event.priority)
    } else {
      const base = defaultDate ?? new Date()
      const start = new Date(base)
      start.setMinutes(0, 0, 0)
      const end = new Date(start)
      end.setHours(end.getHours() + 1)
      setTitle('')
      setStartTime(toLocalDatetimeInput(start))
      setEndTime(toLocalDatetimeInput(end))
      setAllDay(false)
      setDescription('')
      setLocation('')
      setColor('#4F46E5')
      setPriority('medium')
    }
    setConfirmDelete(false)
  }, [open, mode, event, defaultDate])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const input: CreateEventInput = {
      title,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      all_day: allDay,
      description: description || undefined,
      location: location || undefined,
      color,
      priority,
    }
    if (mode === 'create') {
      await onCreate(input)
    } else if (event) {
      await onUpdate(event.id, input)
    }
    setLoading(false)
    onClose()
  }

  async function handleDelete() {
    if (!event) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    await onDelete(event.id)
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === 'create' ? 'New event' : 'Edit event'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <input
            type="text"
            placeholder="Event title"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inputCls + ' text-base font-medium'}
            autoFocus
          />

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${allDay ? 'bg-indigo-600' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${allDay ? 'translate-x-4' : 'translate-x-0.5'}`} />
              <input
                type="checkbox"
                checked={allDay}
                onChange={e => setAllDay(e.target.checked)}
                className="sr-only"
              />
            </div>
            <span className="text-sm text-gray-700">All day</span>
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>End</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start date</label>
                <input
                  type="date"
                  required
                  value={startTime.split('T')[0]}
                  onChange={e => setStartTime(e.target.value + 'T00:00')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>End date</label>
                <input
                  type="date"
                  required
                  value={endTime.split('T')[0]}
                  onChange={e => setEndTime(e.target.value + 'T23:59')}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className={inputCls}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform duration-100 ${color === c ? 'ring-2 ring-offset-1 ring-gray-600 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <input
            type="text"
            placeholder="Location (optional)"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className={inputCls}
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={inputCls + ' resize-none'}
          />

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {mode === 'edit' ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className={`text-sm font-medium transition-all duration-150 ${
                  confirmDelete
                    ? 'text-white bg-red-500 hover:bg-red-600 px-3.5 py-2 rounded-lg'
                    : 'text-red-500 hover:text-red-700'
                }`}
              >
                {confirmDelete ? 'Confirm delete' : 'Delete'}
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
