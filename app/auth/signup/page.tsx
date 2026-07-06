'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-successtext rounded-2xl mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-ink">Check your email</h2>
          <p className="text-sm text-mute mt-2 leading-relaxed">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block text-sm text-info font-medium hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-successtext rounded-2xl mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Create account</h1>
          <p className="text-sm text-mute mt-1">Start your AI dashboard</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-[rgba(0,0,0,0.07)] px-8 py-8">
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink" htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="h-11 rounded-xl border border-[rgba(0,0,0,0.1)] px-3.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-successtext focus:border-transparent transition-all"
                placeholder="Raiyan Ahmed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-11 rounded-xl border border-[rgba(0,0,0,0.1)] px-3.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-successtext focus:border-transparent transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11 rounded-xl border border-[rgba(0,0,0,0.1)] px-3.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-successtext focus:border-transparent transition-all"
                placeholder="Min. 8 characters"
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
              className="h-11 mt-1 bg-successtext text-white text-sm font-medium rounded-xl hover:bg-successtext active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-mute mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-successtext font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
