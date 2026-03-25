import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/cn'

interface CoachNeyAvatarProps {
  size: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { container: 'w-6 h-6', icon: 12 },
  md: { container: 'w-8 h-8', icon: 16 },
  lg: { container: 'w-12 h-12', icon: 24 },
}

export function CoachNeyAvatar({ size }: CoachNeyAvatarProps) {
  const s = sizeMap[size]

  return (
    <div
      className={cn(
        s.container,
        'rounded-full bg-accent-400/20 flex items-center justify-center flex-shrink-0'
      )}
    >
      <GraduationCap size={s.icon} className="text-accent-400" />
    </div>
  )
}
