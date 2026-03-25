'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-text-tertiary text-sm font-mono mb-2">
          {error.digest ? `Error ${error.digest}` : 'Server error'}
        </p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
        <p className="text-text-secondary text-sm mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="border border-black/10 text-text-primary rounded-xl px-5 py-2.5 text-sm hover:bg-bg-overlay transition-all duration-150"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-accent-400 text-text-inverse rounded-pill px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
