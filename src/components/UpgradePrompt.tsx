'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'

export function UpgradePrompt({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-400/5 border border-accent-400/15">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-400/10 flex items-center justify-center mt-0.5">
        <Zap size={16} className="text-accent-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary mb-0.5">{title}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      <Link
        href="/pricing"
        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-semibold text-accent-400 border border-accent-400/25 hover:bg-accent-400/10 transition-all duration-150"
      >
        See Plans
        <ArrowRight size={12} />
      </Link>
    </div>
  )
}
