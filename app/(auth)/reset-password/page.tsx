'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-150'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [ready, setReady] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setExchangeError('Invalid or expired reset link.')
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError(error.message)
      } else {
        setReady(true)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/calendar'), 2000)
    }
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
          {exchangeError ? (
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">{exchangeError}</p>
              <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-600">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Password updated. Redirecting…</p>
            </div>
          ) : !ready ? (
            <div className="flex items-center justify-center py-6">
              <svg className="w-5 h-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Set new password</h1>
              <p className="text-sm text-gray-500 mb-6">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-600">{error}</div>
                )}
                <div>
                  <label htmlFor="password" className={labelCls}>New password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className={labelCls}>Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={inputCls}
                    placeholder="Repeat your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors duration-150 disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
