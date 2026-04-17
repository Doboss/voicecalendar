'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSetupMessage } from '@/lib/gemini/buildSetupMessage'

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

  const statusRef = useRef<VoiceStatus>('idle')
  const wsRef = useRef<WebSocket | null>(null)
  const playbackContextRef = useRef<AudioContext | null>(null)
  const nextPlayTimeRef = useRef(0)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onToolCallRef = useRef(onToolCall)
  const micStreamRef = useRef<MediaStream | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const micContextRef = useRef<AudioContext | null>(null)

  useEffect(() => { onToolCallRef.current = onToolCall }, [onToolCall])

  function updateStatus(s: VoiceStatus) {
    statusRef.current = s
    setStatus(s)
  }

  // ── Audio playback ──────────────────────────────────────────────────────────
  // Chunks are scheduled directly on the AudioContext clock for gapless playback.
  // A small pre-buffer delay before the first chunk prevents stutter from network jitter.

  const PRE_BUFFER_S = 0.08 // 80ms pre-buffer on first chunk of each turn

  function enqueueAudioChunk(pcm: Int16Array) {
    const ctx = playbackContextRef.current
    if (!ctx) return

    const float32 = new Float32Array(pcm.length)
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 32768

    const buffer = ctx.createBuffer(1, float32.length, 24000)
    buffer.copyToChannel(float32, 0)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const now = ctx.currentTime
    if (nextPlayTimeRef.current < now + PRE_BUFFER_S) {
      // First chunk of a turn (or we've fallen behind) — anchor with pre-buffer
      nextPlayTimeRef.current = now + PRE_BUFFER_S
    }
    source.start(nextPlayTimeRef.current)
    nextPlayTimeRef.current += buffer.duration
  }

  // ── Microphone capture ──────────────────────────────────────────────────────

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    micStreamRef.current = stream

    const ctx = new AudioContext({ sampleRate: 16000 })
    micContextRef.current = ctx

    await ctx.audioWorklet.addModule('/worklets/pcm-processor.js')
    const node = new AudioWorkletNode(ctx, 'pcm-processor')
    workletNodeRef.current = node

    // Accumulate small worklet chunks (128 samples) into ~100ms buffers before sending
    const CHUNK_MS = 100
    const CHUNK_SAMPLES = 16000 * CHUNK_MS / 1000 // 1600 samples
    let accumulated = new Int16Array(0)

    node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      const chunk = new Int16Array(e.data)
      const merged = new Int16Array(accumulated.length + chunk.length)
      merged.set(accumulated)
      merged.set(chunk, accumulated.length)
      accumulated = merged

      if (accumulated.length >= CHUNK_SAMPLES) {
        const toSend = accumulated
        accumulated = new Int16Array(0)

        const bytes = new Uint8Array(toSend.buffer)
        let bin = ''
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
        ws.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: btoa(bin) }],
          },
        }))
      }
    }

    const source = ctx.createMediaStreamSource(stream)
    source.connect(node)
    console.log('[Voice] Microphone started, streaming audio to Gemini')
  }

  function stopMic() {
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
    micContextRef.current?.close()
    micContextRef.current = null
  }

  // ── Tool result ──────────────────────────────────────────────────────────────

  const sendToolResult = useCallback((id: string, result: unknown) => {
    wsRef.current?.send(JSON.stringify({
      toolResponse: {
        functionResponses: [{ id, response: { output: result } }],
      },
    }))
  }, [])

  // ── Message handler ─────────────────────────────────────────────────────────

  async function handleMessage(event: MessageEvent) {
    const raw = event.data instanceof Blob ? await event.data.text() : String(event.data)
    let msg: Record<string, unknown>
    try { msg = JSON.parse(raw) } catch { return }

    // Log all incoming messages for debugging
    console.log('[Gemini WS]', JSON.stringify(msg).slice(0, 300))

    // Wait for setupComplete before starting mic
    if (msg.setupComplete !== undefined) {
      console.log('[Voice] Setup complete, starting mic')
      try {
        await startMic()
        updateStatus('listening')
      } catch (err) {
        console.error('[Voice] Mic error:', err)
        setError('Microphone access denied')
        updateStatus('error')
      }
      return
    }

    // Tool calls
    if (msg.toolCall) {
      const tc = msg.toolCall as { functionCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> }
      for (const call of tc.functionCalls) {
        console.log('[Voice] Tool call:', call.name, call.args)
        try {
          const result = await onToolCallRef.current({ id: call.id, name: call.name, args: call.args })
          console.log('[Voice] Tool result:', call.name, result)
          sendToolResult(call.id, result)
        } catch (err) {
          console.error('[Voice] Tool error:', call.name, err)
          sendToolResult(call.id, { error: String(err) })
        }
      }
      return
    }

    // Audio/text response from model
    const sc = msg.serverContent as {
      modelTurn?: { parts: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> }
      turnComplete?: boolean
      interrupted?: boolean
    } | undefined

    if (sc?.modelTurn?.parts) {
      updateStatus('speaking')
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          const bytes = Uint8Array.from(atob(part.inlineData.data), c => c.charCodeAt(0))
          enqueueAudioChunk(new Int16Array(bytes.buffer))
        }
        if (part.text) {
          setTranscript(prev => [...prev, { role: 'assistant', text: part.text!, timestamp: new Date() }])
        }
      }
    }

    if (sc?.turnComplete) {
      updateStatus('listening')
    }

    if (sc?.interrupted) {
      // User interrupted — reset scheduled playback clock
      nextPlayTimeRef.current = 0
      updateStatus('listening')
    }
  }

  // ── Connect / disconnect ────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (refreshTimerRef.current) { clearTimeout(refreshTimerRef.current); refreshTimerRef.current = null }
    stopMic()
    wsRef.current?.close()
    wsRef.current = null
    playbackContextRef.current?.close()
    playbackContextRef.current = null
    nextPlayTimeRef.current = 0
    updateStatus('idle')
  }, [])

  const connect = useCallback(async () => {
    if (statusRef.current !== 'idle' && statusRef.current !== 'error') return
    updateStatus('connecting')
    setError(null)

    try {
      const res = await fetch('/api/token', { method: 'POST' })
      if (!res.ok) throw new Error(`Token request failed (${res.status})`)
      const { apiKey, error: apiErr } = await res.json()
      if (apiErr) throw new Error(apiErr)

      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`
      console.log('[Voice] Connecting to Gemini Live API...')
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 })

      ws.onopen = () => {
        console.log('[Voice] WebSocket open, sending setup message')
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const setupMsg = buildSetupMessage(timezone)
        console.log('[Voice] Setup message (FULL):', JSON.stringify(setupMsg, null, 2))
        ws.send(JSON.stringify(setupMsg))
        // Status stays 'connecting' until we receive setupComplete
      }

      ws.onmessage = async (event) => {
        const raw = event.data instanceof Blob ? await event.data.text() : String(event.data)
        console.log('[Gemini WS RAW]', raw.slice(0, 200))
        handleMessage(event)
      }

      ws.onerror = (e) => {
        console.error('[Voice] WebSocket error:', e)
        setError('WebSocket connection error — see browser console (F12)')
        updateStatus('error')
      }

      ws.onclose = (e) => {
        console.log('[Voice] WebSocket closed:', e.code, e.reason)
        stopMic()
        if (statusRef.current !== 'idle') updateStatus('idle')
      }

      // Fallback: if no setupComplete within 8 seconds, show error
      const setupTimeout = setTimeout(() => {
        if (statusRef.current === 'connecting') {
          console.error('[Voice] Setup timed out — no setupComplete received')
          setError('Setup timed out. Check your API key or try again.')
          updateStatus('error')
          ws.close()
        }
      }, 8000)

      ws.addEventListener('message', () => clearTimeout(setupTimeout), { once: true })

      refreshTimerRef.current = setTimeout(() => { disconnect(); connect() }, 55 * 60 * 1000)

    } catch (err) {
      console.error('[Voice] Connect error:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      updateStatus('error')
    }
  }, [disconnect])

  useEffect(() => () => { disconnect() }, [disconnect])

  return { status, transcript, error, connect, disconnect, sendToolResult }
}
