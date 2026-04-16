'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { CalendarShell } from '@/components/calendar/CalendarShell'
import type { CreateEventInput } from '@/types/calendar'

const VoicePanel = dynamic(
  () => import('@/components/voice/VoicePanel').then(m => m.VoicePanel),
  { ssr: false }
)

export default function CalendarPage() {
  const router = useRouter()
  const supabase = createClient()
  const { events, loading, createEvent, updateEvent, deleteEvent, listEvents, searchEvents } = useCalendarEvents()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router, supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleUpdate(id: string, input: Partial<CreateEventInput>) {
    return updateEvent({ id, ...input })
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <span className="text-base font-semibold text-indigo-600">Voice Calendar</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Sign out
        </button>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <CalendarShell
                events={events}
                onCreate={createEvent}
                onUpdate={handleUpdate}
                onDelete={deleteEvent}
              />
            </div>
            <VoicePanel
              createEvent={createEvent}
              updateEvent={handleUpdate}
              deleteEvent={deleteEvent}
              listEvents={listEvents}
              searchEvents={searchEvents}
            />
          </>
        )}
      </div>
    </div>
  )
}
