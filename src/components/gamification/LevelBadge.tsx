'use client'

interface LevelBadgeProps {
  level: number
  progress: number // 0 to 1
}

export function LevelBadge({ level, progress }: LevelBadgeProps) {
  const size = 28
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.min(Math.max(progress, 0), 1))

  return (
    <div className="relative w-7 h-7 flex items-center justify-center">
      {/* Background ring */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="text-accent-400 transition-all duration-700 ease-smooth"
        />
      </svg>
      {/* Level number */}
      <span className="text-[10px] font-bold text-accent-400 relative z-10">
        {level}
      </span>
    </div>
  )
}
