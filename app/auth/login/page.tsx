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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Welcome back</h1>
          <p className="text-sm text-mute mt-1">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-hairline px-8 py-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-11 rounded-xl border border-hairline px-3.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink" htmlFor="password">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
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
                className="h-11 rounded-xl border border-hairline px-3.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-dangertext bg-dangertint border border-danger/20 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 mt-1 bg-primary text-white text-sm font-medium rounded-xl hover:brightness-95 active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-mute mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
