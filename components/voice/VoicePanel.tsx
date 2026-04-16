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
    <div className={`flex flex-col border-l bg-white transition-all duration-200 ${collapsed ? 'w-12' : 'w-80'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Voice Assistant</span>
            <StatusIndicator status={status} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`p-1 rounded hover:bg-gray-100 text-gray-500 ${collapsed ? 'mx-auto' : ''}`}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {!collapsed && (
        <>
          {error && (
            <div className="mx-3 mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          <TranscriptFeed entries={transcript} />

          <div className="flex items-center justify-center py-4 border-t">
            <MicButton status={status} onConnect={connect} onDisconnect={disconnect} />
          </div>
        </>
      )}

      {collapsed && (
        <div className="flex-1 flex items-end justify-center pb-4">
          <MicButton status={status} onConnect={connect} onDisconnect={disconnect} />
        </div>
      )}
    </div>
  )
}
