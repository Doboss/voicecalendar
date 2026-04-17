import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedEmails = process.env.ALLOWED_EMAILS
  if (allowedEmails) {
    const allowed = allowedEmails.split(',').map(e => e.trim().toLowerCase())
    if (!allowed.includes((user.email ?? '').toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  // The Live API (WebSocket) validates the key itself on connect.
  // We just proxy it here so it never appears in the client bundle.
  return NextResponse.json({ apiKey })
}
