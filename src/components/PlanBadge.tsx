'use client'

import { Crown } from 'lucide-react'

export function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    basic: { label: 'Free', classes: 'bg-black/5 text-text-tertiary border-black/10' },
    standard: { label: 'Standard', classes: 'bg-accent-400/10 text-accent-400 border-accent-400/25' },
    advanced: { label: 'Advanced', classes: 'bg-violet-500/10 text-violet-300 border-violet-500/25' },
  }
  const c = config[plan] || config.basic

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-semibold border ${c.classes}`}>
      {plan === 'advanced' && <Crown size={10} />}
      {c.label}
    </span>
  )
}
