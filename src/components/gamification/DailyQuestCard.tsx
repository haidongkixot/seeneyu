'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Quest {
  description: string
  target: number
  progress: number
  xpReward: number
  completed: boolean
}

interface DailyQuestCardProps {
  quest: Quest
}

export function DailyQuestCard({ quest }: DailyQuestCardProps) {
  const progressPercent = Math.min((quest.progress / quest.target) * 100, 100)

  return (
    <div
      className={cn(
        'relative bg-bg-surface border border-black/8 rounded-2xl p-4 transition-all duration-200',
        quest.completed && 'border-success/20'
      )}
    >
      {/* Completed overlay */}
      {quest.completed && (
        <div className="absolute inset-0 rounded-2xl bg-success/5 flex items-center justify-center z-10">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <Check size={20} className="text-success" strokeWidth={3} />
          </div>
        </div>
      )}

      <div className={cn(quest.completed && 'opacity-40')}>
        {/* Description */}
        <p className="text-sm text-text-primary font-medium mb-3">
          {quest.description}
        </p>

        {/* Progress bar */}
        <div className="h-2 bg-bg-overlay rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-accent-400 rounded-full transition-all duration-500 ease-smooth"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary">
            {quest.progress}/{quest.target}
          </span>
          <span className="text-[10px] font-bold text-accent-400 bg-accent-400/10 rounded-full px-2 py-0.5">
            +{quest.xpReward} XP
          </span>
        </div>
      </div>
    </div>
  )
}
