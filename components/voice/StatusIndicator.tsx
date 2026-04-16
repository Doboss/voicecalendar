import type { VoiceStatus } from '@/hooks/useGeminiLive'

interface StatusIndicatorProps {
  status: VoiceStatus
}

const labels: Record<VoiceStatus, string> = {
  idle: 'Not connected',
  connecting: 'Connecting…',
  listening: 'Listening',
  speaking: 'Speaking',
  error: 'Error',
}

const dots: Record<VoiceStatus, string> = {
  idle: 'bg-gray-400',
  connecting: 'bg-yellow-400 animate-pulse',
  listening: 'bg-green-400 animate-pulse',
  speaking: 'bg-indigo-400 animate-pulse',
  error: 'bg-red-500',
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${dots[status]}`} />
      <span className="text-xs text-gray-500">{labels[status]}</span>
    </div>
  )
}
