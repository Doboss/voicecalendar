'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-150 disabled:bg-gray-50 disabled:text-gray-400'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5'

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      } else {
        setEmail(user.email ?? '')
      }
    })
  }, [router, supabase])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated successfully.')
      setPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12V6.5a3.5 3.5 0 1 1 7 0V12A3.5 3.5 0 0 1 12 15.5Z" />
              <path d="M19 12a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2Z" />
            </svg>
          </div>
          <Link href="/calendar" className="text-sm font-semibold tracking-tight text-gray-900 hover:text-indigo-600 transition-colors">
            Voice Calendar
          </Link>
        </div>
        <Link href="/calendar" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to calendar
        </Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10 space-y-5">
        <h1 className="text-xl font-semibold text-gray-900">Account settings</h1>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Account info</h2>
          <div>
            <label className={labelCls}>Email address</label>
            <input
              type="email"
              value={email}
              disabled
              className={inputCls}
            />
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Change password</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-600">{error}</div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-3 text-sm text-emerald-700">{success}</div>
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
              <label htmlFor="confirm" className={labelCls}>Confirm new password</label>
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
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors duration-150 disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Session</h2>
          <button
            onClick={handleSignOut}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors duration-150"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
