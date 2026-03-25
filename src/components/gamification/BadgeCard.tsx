'use client'

import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  category: 'consistency' | 'mastery' | 'social' | 'volume' | 'special'
}

interface BadgeCardProps {
  badge: Badge
  earned?: boolean
  earnedAt?: string
}

const categoryAccent: Record<Badge['category'], string> = {
  consistency: 'border-accent-400/30 bg-accent-400/5',
  mastery: 'border-purple-400/30 bg-purple-400/5',
  social: 'border-cyan-400/30 bg-cyan-400/5',
  volume: 'border-emerald-400/30 bg-emerald-400/5',
  special: 'border-rose-400/30 bg-rose-400/5',
}

const categoryText: Record<Badge['category'], string> = {
  consistency: 'text-accent-400',
  mastery: 'text-purple-400',
  social: 'text-cyan-400',
  volume: 'text-emerald-400',
  special: 'text-rose-400',
}

export function BadgeCard({ badge, earned, earnedAt }: BadgeCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border p-4 transition-all duration-200',
        earned
          ? categoryAccent[badge.category]
          : 'border-black/6 bg-bg-surface grayscale'
      )}
    >
      {/* Icon */}
      <div className="relative mb-3">
        <span className={cn('text-3xl', !earned && 'opacity-40')}>
          {badge.emoji}
        </span>
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={16} className="text-text-tertiary" />
          </div>
        )}
      </div>

      {/* Name */}
      <p
        className={cn(
          'text-sm font-semibold mb-0.5',
          earned ? categoryText[badge.category] : 'text-text-tertiary'
        )}
      >
        {badge.name}
      </p>

      {/* Description */}
      <p className="text-xs text-text-tertiary leading-relaxed">
        {badge.description}
      </p>

      {/* Earned date */}
      {earned && earnedAt && (
        <p className="text-[10px] text-text-tertiary mt-2">
          Earned {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
