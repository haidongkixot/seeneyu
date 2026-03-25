'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

interface XpFloatTextProps {
  amount: number
  visible: boolean
}

export function XpFloatText({ amount, visible }: XpFloatTextProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!show) return null

  return (
    <span
      className={cn(
        'absolute pointer-events-none text-sm font-bold text-accent-400',
        'animate-xp-float'
      )}
      aria-hidden="true"
    >
      +{amount} XP
    </span>
  )
}
