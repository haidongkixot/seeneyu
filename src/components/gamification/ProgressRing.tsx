'use client'

import { useEffect, useState } from 'react'

interface ProgressRingProps {
  progress: number // 0 to 1
  size: number // px
  strokeWidth?: number
  color?: string
  label?: string
}

export function ProgressRing({
  progress,
  size,
  strokeWidth = 3,
  color = 'text-accent-400',
  label,
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.min(Math.max(progress, 0), 1)
  const dashOffset = mounted ? circumference * (1 - clampedProgress) : circumference

  useEffect(() => {
    // Trigger animation on mount
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clampedProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${Math.round(clampedProgress * 100)}% progress`}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-overlay"
        />
        {/* Progress arc */}
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
          className={`${color} transition-all duration-700 ease-smooth`}
        />
      </svg>
      {label && (
        <span className="relative z-10 text-[10px] font-bold text-text-primary">
          {label}
        </span>
      )}
    </div>
  )
}
