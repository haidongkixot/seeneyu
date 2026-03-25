'use client'

import { Sparkles } from 'lucide-react'

export function FreeTierBadge({ used, total }: { used: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-semibold bg-info/10 text-info border border-info/20">
      <Sparkles size={12} />
      {used} of {total} free
    </span>
  )
}
