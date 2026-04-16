'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSetupMessage } from '@/lib/gemini/buildSetupMessage'
import { useAudioCapture } from './useAudioCapture'

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'

export interface TranscriptEntry {
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

export interface ToolCallEvent {
  id: string
  name: string
  args: Record<string, unknown>
}

interface UseGeminiLiveOptions {
  onToolCall: (call: ToolCallEvent) => Promise<unknown>
}

export function useGeminiLive({ onToolCall }: UseGeminiLiveOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const playbackQueueRef = useRef<Int16Array[]>([])
  const playbackContextRef = useRef<AudioContext | null>(null)
  const isPlayingRef = useRef(false)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    setTranscript(prev => [...prev, { role, text, timestamp: new Date() }])
  }, [])

  const playNextChunk = useCallback(async () => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return
    isPlayingRef.current = true

    const ctx = playbackContextRef.current
    if (!ctx) { isPlayingRef.current = false; return }

    const pcm = playbackQueueRef.current.shift()!
    const float32 = new Float32Array(pcm.length)
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 32768

    const buffer = ctx.createBuffer(1, float32.length, 24000)
    buffer.copyToChannel(float32, 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.onended = () => {
      isPlayingRef.current = false
      playNextChunk()
    }
    source.start()
  }, [])

  const sendToolResult = useCallback((id: string, result: unknown) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({
      toolResponse: {
        functionResponses: [{ id, response: { output: result } }],
      },
    }))
  }, [])

  const handleMessage = useCallback(async (event: MessageEvent) => {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(event.data as string)
    } catch {
      return
    }

    // Handle tool calls
    if (msg.toolCall) {
      const tc = msg.toolCall as { functionCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> }
      for (const call of tc.functionCalls) {
        try {
          const result = await onToolCall({ id: call.id, name: call.name, args: call.args })
          sendToolResult(call.id, result)
        } catch (err) {
          sendToolResult(call.id, { error: String(err) })
        }
      }
      return
    }

    // Handle audio and text from model
    const serverContent = msg.serverContent as {
      modelTurn?: { parts: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> }
      turnComplete?: boolean
    } | undefined

    if (serverContent?.modelTurn?.parts) {
      setStatus('speaking')
      for (const part of serverContent.modelTurn.parts) {
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          const bytes = Uint8Array.from(atob(part.inlineData.data), c => c.charCodeAt(0))
          const pcm = new Int16Array(bytes.buffer)
          playbackQueueRef.current.push(pcm)
          playNextChunk()
        }
        if (part.text) {
          addTranscript('assistant', part.text)
        }
      }
    }

    if (serverContent?.turnComplete) {
      setStatus('listening')
    }
  }, [onToolCall, sendToolResult, playNextChunk, addTranscript])

  const audioCapture = useAudioCapture({
    onChunk: useCallback((pcm: ArrayBuffer) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      // Send as base64-encoded realtime audio input
      const bytes = new Uint8Array(pcm)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      const b64 = btoa(binary)
      wsRef.current.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: b64 }],
        },
      }))
    }, []),
  })

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError(null)

    try {
      const res = await fetch('/api/token', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to get API token')
      const { apiKey } = await res.json()

      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      playbackContextRef.current = new AudioContext({ sampleRate: 24000 })

      ws.onopen = () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        ws.send(JSON.stringify(buildSetupMessage(timezone)))
        setStatus('listening')
        audioCapture.start()
      }

      ws.onmessage = handleMessage

      ws.onerror = () => {
        setStatus('error')
        setError('WebSocket connection error')
      }

      ws.onclose = () => {
        if (status !== 'idle') setStatus('idle')
        audioCapture.stop()
      }

      // Schedule token refresh ~5 min before 1-hour TTL
      refreshTimerRef.current = setTimeout(() => {
        disconnect()
        connect()
      }, 55 * 60 * 1000)

    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [handleMessage, audioCapture, status])

  const disconnect = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    audioCapture.stop()
    wsRef.current?.close()
    wsRef.current = null
    playbackContextRef.current?.close()
    playbackContextRef.current = null
    playbackQueueRef.current = []
    isPlayingRef.current = false
    setStatus('idle')
  }, [audioCapture])

  useEffect(() => () => { disconnect() }, [disconnect])

  return { status, transcript, error, connect, disconnect, sendToolResult }
}
