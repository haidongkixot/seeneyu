'use client'

import { useEffect } from 'react'
import { Flame, X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StreakToastProps {
  streak: number
  visible: boolean
  onDismiss: () => void
}

export function StreakToast({ streak, visible, onDismiss }: StreakToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'fixed top-20 right-4 z-toast flex items-center gap-3',
        'bg-bg-elevated border border-accent-400/30 rounded-xl px-4 py-3 shadow-lg',
        'animate-slide-in-right'
      )}
      style={{
        animation: 'slide-in-right 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <Flame
        size={24}
        className="text-accent-400 animate-flame-flicker flex-shrink-0"
        fill="currentColor"
      />
      <div>
        <p className="text-sm font-bold text-text-primary">
          {streak}-day streak!
        </p>
        <p className="text-xs text-text-secondary">Keep it going!</p>
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
        aria-label="Dismiss streak notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}
