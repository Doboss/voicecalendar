'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@/types/calendar'

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

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
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (!uid) { console.error('createEvent: not authenticated'); return null }

    const { data, error } = await supabase
      .from('events')
      .insert({ ...input, user_id: uid })
      .select()
      .single()
    if (error) { console.error('createEvent:', error.message, error.details); return null }
    const event = data as CalendarEvent
    setEvents(prev => [...prev, event].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ))
    return event
  }, [supabase, userId])

  const updateEvent = useCallback(async (input: UpdateEventInput): Promise<CalendarEvent | null> => {
    const { id, ...fields } = input
    const { data, error } = await supabase
      .from('events')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('updateEvent:', error.message, error.details); return null }
    const updated = data as CalendarEvent
    setEvents(prev => prev.map(e => e.id === id ? updated : e))
    return updated
  }, [supabase])

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) { console.error('deleteEvent:', error.message); return false }
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
    if (error) { console.error('listEvents:', error.message); return [] }
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
    if (error) { console.error('searchEvents:', error.message); return [] }
    return data as CalendarEvent[]
  }, [supabase])

  return { events, loading, createEvent, updateEvent, deleteEvent, listEvents, searchEvents, refetch: fetchEvents }
}
