'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/cn'

interface HeartCounterProps {
  hearts: number
  unlimited?: boolean
}

export function HeartCounter({ hearts, unlimited }: HeartCounterProps) {
  const prevHearts = useRef(hearts)
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (hearts < prevHearts.current) {
      // A heart was lost — pulse the last filled heart
      setPulsingIndex(hearts)
      const timer = setTimeout(() => setPulsingIndex(null), 600)
      prevHearts.current = hearts
      return () => clearTimeout(timer)
    }
    prevHearts.current = hearts
  }, [hearts])

  if (unlimited) {
    return (
      <div className="flex items-center gap-1">
        <Heart size={14} className="text-red-500" fill="currentColor" />
        <span className="text-xs font-bold text-red-500">&infin;</span>
        <span className="sr-only">Unlimited hearts</span>
      </div>
    )
  }

  const total = 5

  return (
    <>
      {/* Mobile: compact heart + number */}
      <div className="flex md:hidden items-center gap-0.5" aria-label={`${hearts} of ${total} hearts remaining`}>
        <Heart size={14} className="text-red-500" fill="currentColor" />
        <span className="text-xs font-bold text-red-500">{hearts}</span>
      </div>

      {/* Desktop: individual heart icons */}
      <div className="hidden md:flex items-center gap-0.5" aria-label={`${hearts} of ${total} hearts remaining`}>
        {Array.from({ length: total }, (_, i) => {
          const filled = i < hearts
          const isPulsing = pulsingIndex === i

          return (
            <Heart
              key={i}
              size={14}
              className={cn(
                'transition-all duration-200',
                filled ? 'text-red-500' : 'text-text-tertiary',
                isPulsing && 'animate-heart-pulse'
              )}
              fill={filled ? 'currentColor' : 'none'}
              strokeWidth={filled ? 0 : 1.5}
            />
          )
        })}
      </div>
    </>
  )
}
