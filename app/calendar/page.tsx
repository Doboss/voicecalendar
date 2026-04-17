'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12V6.5a3.5 3.5 0 1 1 7 0V12A3.5 3.5 0 0 1 12 15.5Z" />
              <path d="M19 12a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900">Voice Calendar</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/account" className="text-sm text-gray-400 hover:text-gray-700 transition-colors duration-150">
            Account
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors duration-150"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden pb-20 lg:pb-0">
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
