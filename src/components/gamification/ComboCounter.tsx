'use client'

import { cn } from '@/lib/cn'

interface ComboCounterProps {
  combo: number
  visible: boolean
}

const comboStyles: Record<number, string> = {
  2: 'text-accent-400',
  3: 'text-yellow-300',
  4: 'text-orange-400',
  5: 'text-white',
}

export function ComboCounter({ combo, visible }: ComboCounterProps) {
  if (!visible || combo < 2) return null

  const colorClass = comboStyles[Math.min(combo, 5)] ?? comboStyles[5]

  return (
    <div
      className={cn(
        'fixed top-20 right-6 z-raised pointer-events-none',
        'animate-bounce-in'
      )}
      key={combo} // remount to retrigger animation
    >
      <span
        className={cn(
          'text-3xl font-black tabular-nums animate-combo-glow',
          colorClass
        )}
      >
        {Math.min(combo, 5)}x
      </span>
    </div>
  )
}
