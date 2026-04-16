'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@/types/calendar'

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })
    if (!error && data) setEvents(data as CalendarEvent[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchEvents()

    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchEvents, supabase])

  const createEvent = useCallback(async (input: CreateEventInput): Promise<CalendarEvent | null> => {
    const { data, error } = await supabase
      .from('events')
      .insert(input)
      .select()
      .single()
    if (error) { console.error('createEvent:', error); return null }
    const event = data as CalendarEvent
    setEvents(prev => [...prev, event].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ))
    return event
  }, [supabase])

  const updateEvent = useCallback(async (input: UpdateEventInput): Promise<CalendarEvent | null> => {
    const { id, ...fields } = input
    const { data, error } = await supabase
      .from('events')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('updateEvent:', error); return null }
    const updated = data as CalendarEvent
    setEvents(prev => prev.map(e => e.id === id ? updated : e))
    return updated
  }, [supabase])

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) { console.error('deleteEvent:', error); return false }
    setEvents(prev => prev.filter(e => e.id !== id))
    return true
  }, [supabase])

  const listEvents = useCallback(async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', startDate)
      .lte('start_time', endDate + 'T23:59:59')
      .order('start_time', { ascending: true })
    if (error) return []
    return data as CalendarEvent[]
  }, [supabase])

  const searchEvents = useCallback(async (query: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> => {
    let q = supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    if (startDate) q = q.gte('start_time', startDate)
    if (endDate) q = q.lte('start_time', endDate + 'T23:59:59')
    q = q.order('start_time', { ascending: true })
    const { data, error } = await q
    if (error) return []
    return data as CalendarEvent[]
  }, [supabase])

  return { events, loading, createEvent, updateEvent, deleteEvent, listEvents, searchEvents, refetch: fetchEvents }
}
