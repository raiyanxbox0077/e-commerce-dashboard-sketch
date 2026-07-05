'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0066cc] rounded-2xl mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Sign in</h1>
          <p className="text-sm text-[#6e6e73] mt-1">to your AI dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.08)] px-8 py-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1d1d1f]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-11 rounded-xl border border-[rgba(0,0,0,0.12)] px-3.5 text-sm text-[#1d1d1f] bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1d1d1f]" htmlFor="password">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-[#0066cc] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11 rounded-xl border border-[rgba(0,0,0,0.12)] px-3.5 text-sm text-[#1d1d1f] bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 mt-1 bg-[#0066cc] text-white text-sm font-medium rounded-xl hover:bg-[#0055b3] active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6e6e73] mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-[#0066cc] font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
