'use client'

import { useState } from 'react'
import { useGeminiLive, type ToolCallEvent } from '@/hooks/useGeminiLive'
import { MicButton } from './MicButton'
import { StatusIndicator } from './StatusIndicator'
import { TranscriptFeed } from './TranscriptFeed'
import type { CalendarEvent, CreateEventInput } from '@/types/calendar'

interface VoicePanelProps {
  createEvent: (input: CreateEventInput) => Promise<CalendarEvent | null>
  updateEvent: (id: string, input: Partial<CreateEventInput>) => Promise<CalendarEvent | null>
  deleteEvent: (id: string) => Promise<boolean>
  listEvents: (start: string, end: string) => Promise<CalendarEvent[]>
  searchEvents: (query: string, start?: string, end?: string) => Promise<CalendarEvent[]>
}

export function VoicePanel({ createEvent, updateEvent, deleteEvent, listEvents, searchEvents }: VoicePanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleToolCall(call: ToolCallEvent): Promise<unknown> {
    const args = call.args
    switch (call.name) {
      case 'createEvent':
        return createEvent({
          title: args.title as string,
          start_time: args.start_time as string,
          end_time: args.end_time as string,
          all_day: args.all_day as boolean | undefined,
          description: args.description as string | undefined,
          location: args.location as string | undefined,
          color: args.color as string | undefined,
          priority: args.priority as 'low' | 'medium' | 'high' | undefined,
        })

      case 'updateEvent':
        return updateEvent(args.id as string, {
          title: args.title as string | undefined,
          start_time: args.start_time as string | undefined,
          end_time: args.end_time as string | undefined,
          all_day: args.all_day as boolean | undefined,
          description: args.description as string | undefined,
          location: args.location as string | undefined,
          color: args.color as string | undefined,
          priority: args.priority as 'low' | 'medium' | 'high' | undefined,
        })

      case 'deleteEvent':
        return deleteEvent(args.id as string)

      case 'listEvents':
        return listEvents(args.start_date as string, args.end_date as string)

      case 'searchEvents':
        return searchEvents(
          args.query as string,
          args.start_date as string | undefined,
          args.end_date as string | undefined
        )

      default:
        return { error: `Unknown tool: ${call.name}` }
    }
  }

  const { status, transcript, error, connect, disconnect } = useGeminiLive({ onToolCall: handleToolCall })

  return (
    <>
      {/* ── Desktop side panel (lg+) ── */}
      <div className={`hidden lg:flex flex-col bg-white shadow-[-1px_0_0_0_#f1f5f9] transition-all duration-200 ${collapsed ? 'w-12' : 'w-80'}`}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-50">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">Voice Assistant</span>
              <StatusIndicator status={status} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150 ${collapsed ? 'mx-auto' : 'shrink-0'}`}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              {collapsed ? (
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>

        {!collapsed && (
          <>
            {error && (
              <div className="mx-3 mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</div>
            )}
            <TranscriptFeed entries={transcript} />
            <div className="flex items-center justify-center py-5 border-t border-gray-50">
              <MicButton status={status} onConnect={connect} onDisconnect={disconnect} />
            </div>
          </>
        )}

        {collapsed && (
          <div className="flex-1 flex items-end justify-center pb-5">
            <MicButton status={status} onConnect={connect} onDisconnect={disconnect} />
          </div>
        )}
      </div>

      {/* ── Mobile bottom sheet (< lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className={`relative bg-white border-t border-gray-200 shadow-2xl transition-all duration-300 ${mobileOpen ? 'rounded-t-2xl' : ''}`}>
          {mobileOpen && (
            <div className="h-72 flex flex-col pt-1">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">Voice Assistant</span>
                  <StatusIndicator status={status} />
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
              {error && (
                <div className="mx-3 mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</div>
              )}
              <TranscriptFeed entries={transcript} />
            </div>
          )}

          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <StatusIndicator status={status} />
              <span>{mobileOpen ? 'Collapse' : 'Voice Assistant'}</span>
            </button>
            <MicButton status={status} onConnect={connect} onDisconnect={disconnect} />
          </div>
        </div>
      </div>
    </>
  )
}
