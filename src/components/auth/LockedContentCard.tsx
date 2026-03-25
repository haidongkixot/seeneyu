'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

export function LockedContentCard({
  children,
  message,
}: {
  children: React.ReactNode
  message?: string
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred content underneath */}
      <div className="blur-[6px] pointer-events-none select-none opacity-60">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-base/40 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full bg-bg-surface border border-black/10 flex items-center justify-center shadow-md">
          <Lock size={20} className="text-text-tertiary" />
        </div>
        <p className="text-sm text-text-secondary text-center max-w-[200px]">
          {message || 'Sign in to unlock this content'}
        </p>
        <Link
          href="/auth/signin"
          className="px-5 py-2 rounded-pill bg-accent-400 text-text-inverse font-semibold text-sm hover:bg-accent-500 shadow-glow-sm transition-all duration-150"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
