'use client'
import { Lock } from 'lucide-react'
import Link from 'next/link'

export function LockedFeedbackSection({ isLocked, children }: { isLocked: boolean, children: React.ReactNode }) {
  if (!isLocked) return <>{children}</>
  return (
    <div className="relative">
      <div className="filter blur-[6px] pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-base/60 rounded-2xl">
        <Lock className="w-8 h-8 text-text-tertiary mb-3" />
        <p className="text-sm font-medium text-text-secondary mb-2">Detailed feedback for paid plans</p>
        <Link href="/pricing" className="px-4 py-2 bg-accent-400 text-text-inverse rounded-full text-sm font-semibold hover:bg-accent-500 transition-colors">
          Upgrade Now
        </Link>
      </div>
    </div>
  )
}
