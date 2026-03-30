'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Clock, XCircle, ShieldOff } from 'lucide-react'

const STATUS_ERRORS: Record<string, { message: string; icon: React.ReactNode; color: string }> = {
  pending: {
    message: 'Your account is pending admin approval. Please wait for an administrator to review your registration.',
    icon: <Clock size={16} className="text-accent-400 shrink-0 mt-0.5" />,
    color: 'bg-accent-400/10 border-accent-400/20 text-accent-400',
  },
  rejected: {
    message: 'Your account has been rejected.',
    icon: <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />,
    color: 'bg-red-500/10 border-red-500/20 text-red-400',
  },
  suspended: {
    message: 'Your account has been suspended. Contact an administrator for more information.',
    icon: <ShieldOff size={16} className="text-red-400 shrink-0 mt-0.5" />,
    color: 'bg-red-500/10 border-red-500/20 text-red-400',
  },
}

export default function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(errorParam ? 'Invalid email or password.' : '')
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatusError(null)
    setStatusNote(null)
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)

    if (result?.error) {
      // Check if the error contains a status code from our auth
      if (result.error.startsWith('status:')) {
        const parts = result.error.split('|')
        const status = parts[0].replace('status:', '')
        const note = parts[1] || null
        setStatusError(status)
        setStatusNote(note)
      } else {
        setError('Invalid email or password.')
      }
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  const statusInfo = statusError ? STATUS_ERRORS[statusError] : null

  return (
    <>
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-black tracking-tight text-text-primary hover:text-accent-400 transition-colors">
          seeneyu
        </Link>
        <p className="mt-2 text-text-secondary text-sm">Sign in to your account</p>
      </div>

      <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {statusInfo && (
            <div className={`${statusInfo.color} border rounded-xl px-3 py-3`}>
              <div className="flex items-start gap-2">
                {statusInfo.icon}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{statusInfo.message}</span>
                  {statusNote && (
                    <span className="text-xs opacity-80">Reason: {statusNote}</span>
                  )}
                </div>
              </div>
              {statusError === 'pending' && (
                <Link
                  href="/auth/pending"
                  className="mt-2 inline-block text-xs underline opacity-80 hover:opacity-100 transition-opacity"
                >
                  View pending page
                </Link>
              )}
            </div>
          )}

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
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent-400/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-accent-400 hover:text-accent-300 transition-colors font-medium">
          Sign up
        </Link>
      </p>
    </>
  )
}
