import { SKILL_COLORS, SKILL_LABELS, type SkillCategory } from '@/lib/types'
import { cn } from '@/lib/cn'

interface SkillBadgeProps {
  skill: SkillCategory
  size?: 'sm' | 'md'
  interactive?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function SkillBadge({
  skill,
  size = 'md',
  interactive = false,
  selected = false,
  onClick,
  className,
}: SkillBadgeProps) {
  const colors = SKILL_COLORS[skill]
  const label = SKILL_LABELS[skill]

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
        'inline-flex items-center border rounded-pill font-semibold uppercase tracking-wide',
        'backdrop-blur-sm transition-all duration-150',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        interactive && 'cursor-pointer hover:opacity-90 select-none',
        interactive && 'focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none',
        className,
      )}
    >
      {label}
    </span>
  )
}
