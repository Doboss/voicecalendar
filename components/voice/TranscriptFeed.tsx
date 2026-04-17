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
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12V6.5a3.5 3.5 0 1 1 7 0V12A3.5 3.5 0 0 1 12 15.5Z" />
            <path d="M19 12a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2Z" />
          </svg>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Tap the mic and speak to manage your calendar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {entries.map((entry, i) => (
        <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            entry.role === 'user'
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}>
            <p>{entry.text}</p>
            <p className={`text-xs mt-1 ${entry.role === 'user' ? 'text-indigo-300' : 'text-gray-400'}`}>
              {format(entry.timestamp, 'HH:mm')}
            </p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
