'use client'

import { cn } from '@/lib/cn'
import { CoachNeyAvatar } from './CoachNeyAvatar'

interface CoachNeySaysProps {
  message: string
  size?: 'sm' | 'md' | 'lg'
}

export function CoachNeySays({ message, size = 'md' }: CoachNeySaysProps) {
  return (
    <div className="flex items-start gap-2.5">
      <CoachNeyAvatar size={size} />
      <div
        className={cn(
          'relative bg-accent-400/10 border border-accent-400/20 rounded-2xl px-3.5 py-2.5',
          'text-sm text-text-primary leading-relaxed'
        )}
      >
        {/* Tail */}
        <div className="absolute -left-1.5 top-3 w-3 h-3 bg-accent-400/10 border-l border-b border-accent-400/20 rotate-45" />
        <span className="relative z-10">{message}</span>
      </div>
    </div>
  )
}
