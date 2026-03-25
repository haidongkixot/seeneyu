'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'

interface XpBarProps {
  currentXp: number
  xpForNextLevel: number
  recentGain?: number
}

export function XpBar({ currentXp, xpForNextLevel, recentGain }: XpBarProps) {
  const [showGain, setShowGain] = useState(false)
  const progress = Math.min((currentXp / xpForNextLevel) * 100, 100)

  useEffect(() => {
    if (recentGain && recentGain > 0) {
      setShowGain(true)
      const timer = setTimeout(() => setShowGain(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [recentGain])

  return (
    <div className="relative w-full h-1 bg-bg-overlay">
      <div
        className="h-full bg-accent-400 transition-all duration-700 ease-smooth"
        style={{ width: `${progress}%` }}
      />
      {showGain && recentGain && (
        <span
          className={cn(
            'absolute right-4 -top-1 text-xs font-bold text-accent-400',
            'animate-xp-float pointer-events-none'
          )}
        >
          +{recentGain} XP
        </span>
      )}
    </div>
  )
}
