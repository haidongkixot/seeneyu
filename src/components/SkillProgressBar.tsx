import type { SkillLevel } from '@/lib/types'

interface SkillProgressBarProps {
  completed: number
  total: number
  currentLevel: SkillLevel
}

const NEXT_LEVEL: Record<SkillLevel, string> = {
  beginner: 'Intermediate',
  intermediate: 'Advanced',
  advanced: 'Expert',
}

const LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Developing',
  intermediate: 'Practising',
  advanced: 'Fluent',
}

export function SkillProgressBar({ completed, total, currentLevel }: SkillProgressBarProps) {
  const pct = Math.min((completed / total) * 100, 100)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary capitalize">{LEVEL_LABELS[currentLevel]}</span>
        <span className="text-xs text-text-tertiary">{NEXT_LEVEL[currentLevel]}</span>
      </div>
      <div className="relative h-2 bg-black/5 rounded-pill overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-accent-400 rounded-pill transition-all duration-700 ease-smooth"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-secondary">{completed} of {total} clips</span>
    </div>
  )
}
