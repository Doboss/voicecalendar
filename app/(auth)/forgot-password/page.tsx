'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-150'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-full flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-indigo-600">
              <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
              <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Check your inbox</h2>
          <p className="text-sm text-gray-500">
            We sent a password reset link to <strong className="text-gray-700">{email}</strong>.
          </p>
          <Link href="/login" className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors mt-2">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12V6.5a3.5 3.5 0 1 1 7 0V12A3.5 3.5 0 0 1 12 15.5Z" />
              <path d="M19 12a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2Z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">Voice Calendar</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Forgot password?</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-600">{error}</div>
            )}
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors duration-150 disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
