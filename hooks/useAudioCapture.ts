'use client'

import { useCallback, useRef } from 'react'

interface UseAudioCaptureOptions {
  onChunk: (pcm: ArrayBuffer) => void
}

export function useAudioCapture({ onChunk }: UseAudioCaptureOptions) {
  const contextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    streamRef.current = stream

    const context = new AudioContext({ sampleRate: 16000 })
    contextRef.current = context

    await context.audioWorklet.addModule('/worklets/pcm-processor.js')
    const workletNode = new AudioWorkletNode(context, 'pcm-processor')
    workletNodeRef.current = workletNode

    workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      onChunk(event.data)
    }

    const source = context.createMediaStreamSource(stream)
    source.connect(workletNode)
    workletNode.connect(context.destination)
  }, [onChunk])

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    contextRef.current?.close()
    contextRef.current = null
  }, [])

  return { start, stop }
}
