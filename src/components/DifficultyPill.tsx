import { DIFFICULTY_COLORS, type Difficulty } from '@/lib/types'
import { cn } from '@/lib/cn'

interface DifficultyPillProps {
  difficulty: Difficulty
  size?: 'sm' | 'md'
  interactive?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
}

const DOTS: Record<Difficulty, string> = {
  beginner: '●',
  intermediate: '●●',
  advanced: '●●●',
}

const LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function DifficultyPill({
  difficulty,
  size = 'md',
  interactive = false,
  selected = false,
  onClick,
  className,
}: DifficultyPillProps) {
  const colors = DIFFICULTY_COLORS[difficulty]

  const baseStyle: React.CSSProperties = selected
    ? { backgroundColor: colors.border, color: '#ffffff', borderColor: colors.border }
    : { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }

  return (
    <span
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive && onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={baseStyle}
      className={cn(
        'inline-flex items-center gap-1 border rounded-pill font-medium transition-all duration-150',
        'backdrop-blur-sm',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        interactive && 'cursor-pointer hover:opacity-90 select-none',
        interactive && 'focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none',
        className,
      )}
    >
      <span className="opacity-70 text-[0.6rem] tracking-tighter">{DOTS[difficulty]}</span>
      {LABELS[difficulty]}
    </span>
  )
}
