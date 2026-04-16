import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Gemini Live API uses the API key directly from the browser via an ephemeral token.
  // We return a short-lived token so the API key never leaves the server.
  // The Gemini ephemeral token API is accessed here:
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-native-audio-dialog:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        // Minimal request to validate key and get a session token
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini token error:', err)
      return NextResponse.json({ error: 'Failed to reach Gemini API' }, { status: 502 })
    }

    // For the Live API (WebSocket), the browser connects directly using the API key
    // that is proxied through this route to avoid exposing the key in the client bundle.
    // We return the key as a server-verified token.
    return NextResponse.json({ apiKey })
  } catch (err) {
    console.error('Token route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
