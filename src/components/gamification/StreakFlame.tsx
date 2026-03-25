'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StreakFlameProps {
  streak: number
}

function getFlameSize(streak: number): number {
  if (streak >= 30) return 28
  if (streak >= 14) return 24
  if (streak >= 7) return 20
  return 16
}

export function StreakFlame({ streak }: StreakFlameProps) {
  if (streak <= 0) return null

  const size = getFlameSize(streak)

  return (
    <div className="relative group" title={`${streak}-day streak`}>
      <Flame
        size={size}
        className={cn(
          'text-accent-400 animate-flame-flicker',
          streak >= 30 && 'drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
        )}
        fill="currentColor"
        strokeWidth={1.5}
      />
      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-tooltip">
        <span className="text-[10px] bg-bg-elevated border border-black/8 rounded px-1.5 py-0.5 text-text-secondary">
          {streak}-day streak
        </span>
      </div>
    </div>
  )
}
