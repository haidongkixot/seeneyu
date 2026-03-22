'use client'

import Link from 'next/link'

export default function LibraryError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Couldn&apos;t load clips</h1>
        <p className="text-text-secondary text-sm mb-6">
          The library is temporarily unavailable. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="border border-white/10 text-text-primary rounded-xl px-5 py-2.5 text-sm hover:bg-bg-overlay transition-all duration-150"
          >
            Retry
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
