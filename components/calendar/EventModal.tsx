'use client'

import { useEffect, useState } from 'react'
import type { CalendarEvent, CreateEventInput, ModalState, Priority } from '@/types/calendar'
import { toLocalDatetimeInput } from '@/lib/utils/dateUtils'
import { format } from 'date-fns'

const COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280']

interface EventModalProps {
  state: ModalState
  onClose: () => void
  onCreate: (input: CreateEventInput) => Promise<CalendarEvent | null>
  onUpdate: (id: string, input: Partial<CreateEventInput>) => Promise<CalendarEvent | null>
  onDelete: (id: string) => Promise<boolean>
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'New event' : 'Edit event'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <input
              type="text"
              placeholder="Event title"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={e => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700">All day</label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start date</label>
                <input
                  type="date"
                  required
                  value={startTime.split('T')[0]}
                  onChange={e => setStartTime(e.target.value + 'T00:00')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End date</label>
                <input
                  type="date"
                  required
                  value={endTime.split('T')[0]}
                  onChange={e => setEndTime(e.target.value + 'T23:59')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className={`text-sm font-medium ${confirmDelete ? 'text-white bg-red-600 px-3 py-1.5 rounded-md' : 'text-red-600 hover:text-red-800'}`}
              >
                {confirmDelete ? 'Confirm delete' : 'Delete'}
              </button>
            )}
            {mode === 'create' && <div />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
