import { useEffect, useRef } from 'react'
import type { TranscriptEntry } from '@/hooks/useGeminiLive'
import { format } from 'date-fns'

interface TranscriptFeedProps {
  entries: TranscriptEntry[]
}

export function TranscriptFeed({ entries }: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 text-center px-4">
        Press the mic button and start speaking to your calendar assistant.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
      {entries.map((entry, i) => (
        <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
            entry.role === 'user'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}>
            <p>{entry.text}</p>
            <p className={`text-xs mt-0.5 ${entry.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
              {format(entry.timestamp, 'HH:mm')}
            </p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
