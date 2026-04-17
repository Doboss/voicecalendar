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

const dotStyles: Record<VoiceStatus, string> = {
  idle: 'bg-gray-300',
  connecting: 'bg-amber-400 animate-pulse',
  listening: 'bg-emerald-400 animate-pulse',
  speaking: 'bg-indigo-400 animate-pulse',
  error: 'bg-red-500',
}

const textStyles: Record<VoiceStatus, string> = {
  idle: 'text-gray-400',
  connecting: 'text-amber-600',
  listening: 'text-emerald-600',
  speaking: 'text-indigo-600',
  error: 'text-red-500',
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotStyles[status]}`} />
      <span className={`text-xs font-medium ${textStyles[status]}`}>{labels[status]}</span>
    </div>
  )
}
