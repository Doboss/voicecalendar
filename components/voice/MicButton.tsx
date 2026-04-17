import type { VoiceStatus } from '@/hooks/useGeminiLive'

interface MicButtonProps {
  status: VoiceStatus
  onConnect: () => void
  onDisconnect: () => void
}

export function MicButton({ status, onConnect, onDisconnect }: MicButtonProps) {
  const isActive = status !== 'idle' && status !== 'error'
  const isListening = status === 'listening'

  return (
    <div className="relative inline-flex items-center justify-center">
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-red-400 opacity-25 animate-ping-slow" />
      )}
      <button
        onClick={isActive ? onDisconnect : onConnect}
        disabled={status === 'connecting'}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all duration-200 disabled:opacity-40 ${
          isActive
            ? 'bg-red-500 hover:bg-red-400 active:bg-red-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
        }`}
        title={isActive ? 'Stop assistant' : 'Start voice assistant'}
      >
        {status === 'connecting' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 animate-spin">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : isActive ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12V6.5a3.5 3.5 0 1 1 7 0V12A3.5 3.5 0 0 1 12 15.5Z" />
            <path d="M19 12a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2Z" />
          </svg>
        )}
      </button>
    </div>
  )
}
