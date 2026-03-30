'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { X, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export function UpgradeBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)

  const userPlan = (session?.user as any)?.plan || 'basic'

  // Only show for free/basic users
  if (dismissed || userPlan !== 'basic' || !session?.user) return null

  return (
    <div className="relative bg-gradient-to-r from-accent-400/15 via-accent-400/10 to-accent-600/5 border border-accent-400/20 rounded-2xl p-4 pr-10">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-400/20 flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-accent-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary">
            You&apos;re on the <span className="font-semibold">Free</span> plan.
            Unlock full access with Standard — 7-day free trial included.
          </p>
        </div>
        <Link
          href="/pricing"
          className="shrink-0 bg-accent-400 text-text-inverse rounded-xl px-4 py-2 text-xs font-semibold hover:bg-accent-500 transition-colors whitespace-nowrap"
        >
          Start Free Trial &rarr;
        </Link>
      </div>
    </div>
  )
}
