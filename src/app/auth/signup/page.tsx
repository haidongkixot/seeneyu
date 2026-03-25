'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, Clock } from 'lucide-react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-black tracking-tight text-text-primary hover:text-accent-400 transition-colors">
              seeneyu
            </Link>
          </div>

          <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-accent-400/15 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-accent-400" />
            </div>

            <h1 className="text-lg font-bold text-text-primary mb-2">
              Registration Submitted
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-2">
              Your account is under review. An administrator will approve your access shortly.
            </p>

            <div className="flex items-center justify-center gap-2 mt-4 mb-6 bg-accent-400/10 border border-accent-400/20 rounded-xl px-3 py-2">
              <Clock size={14} className="text-accent-400 shrink-0" />
              <span className="text-xs text-accent-400 font-medium">Pending admin approval</span>
            </div>

            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 w-full"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black tracking-tight text-text-primary hover:text-accent-400 transition-colors">
            seeneyu
          </Link>
          <p className="mt-2 text-text-secondary text-sm">Create your free account</p>
        </div>

        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-xl px-3 py-2 text-sm text-error">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent-400/50 transition-colors"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent-400/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent-400/50 transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-accent-400 hover:text-accent-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
