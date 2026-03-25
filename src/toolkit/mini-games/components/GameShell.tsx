'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Gamepad2 } from 'lucide-react'

type RoundStatus = 'correct' | 'wrong' | 'current' | 'upcoming'

interface GameShellProps {
  title: string
  currentRound: number
  totalRounds: number
  score: number
  timeLimit: number
  timerActive: boolean
  onTimeUp: () => void
  roundStatuses: RoundStatus[]
  children: React.ReactNode
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `0:${s.toString().padStart(2, '0')}`
}

export default function GameShell({
  title,
  currentRound,
  totalRounds,
  score,
  timeLimit,
  timerActive,
  onTimeUp,
  roundStatuses,
  children,
}: GameShellProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  // Reset timer when round changes
  useEffect(() => {
    setTimeLeft(timeLimit)
  }, [currentRound, timeLimit])

  // Timer countdown
  useEffect(() => {
    if (!timerActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onTimeUpRef.current()
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerActive, currentRound])

  const timePercent = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0

  const timerBarColor =
    timePercent > 30
      ? 'bg-accent-400'
      : timePercent > 10
        ? 'bg-warning'
        : 'bg-error'

  const timerPulse =
    timePercent <= 10
      ? 'animate-[timer-pulse_0.5s_ease-in-out_infinite]'
      : timePercent <= 30
        ? 'animate-[timer-pulse_1s_ease-in-out_infinite]'
        : ''

  const timerTextColor =
    timePercent > 30
      ? 'text-text-secondary'
      : timePercent > 10
        ? 'text-warning'
        : 'text-error'

  // Previous score for animation
  const [displayScore, setDisplayScore] = useState(score)
  const [scoreAnimating, setScoreAnimating] = useState(false)

  useEffect(() => {
    if (score !== displayScore) {
      setScoreAnimating(true)
      setDisplayScore(score)
      const t = setTimeout(() => setScoreAnimating(false), 300)
      return () => clearTimeout(t)
    }
  }, [score, displayScore])

  return (
    <div className="w-full h-full min-h-[600px] bg-bg-base flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] bg-bg-surface flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-400/10 flex items-center justify-center">
            <Gamepad2 size={16} className="text-accent-400" />
          </div>
          <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
        </div>
        <span className="text-xs font-mono text-text-secondary">
          Round {currentRound}/{totalRounds}
        </span>
      </div>

      {/* Timer bar */}
      <div className="flex-shrink-0 px-4 py-2 bg-bg-surface border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-bg-inset rounded-pill overflow-hidden">
            <div
              className={`h-full rounded-pill transition-all duration-100 ease-linear ${timerBarColor} ${timerPulse}`}
              style={{ width: `${Math.max(0, timePercent)}%` }}
            />
          </div>
          <span
            className={`text-xs font-mono w-10 text-right flex-shrink-0 ${timerTextColor}`}
            aria-live="polite"
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Game content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Score + progress dots */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-surface border-t border-black/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Score</span>
          <span
            className={`text-lg font-bold text-accent-400 font-mono transition-transform duration-200 ${
              scoreAnimating ? 'scale-125' : 'scale-100'
            }`}
          >
            {displayScore}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={currentRound}
          aria-valuemax={totalRounds}
        >
          {roundStatuses.map((status, i) => (
            <div
              key={i}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-200
                ${status === 'correct' ? 'bg-success scale-100' : ''}
                ${status === 'wrong' ? 'bg-error scale-100' : ''}
                ${status === 'current' ? 'bg-accent-400 scale-110 shadow-glow-sm' : ''}
                ${status === 'upcoming' ? 'bg-black/5' : ''}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
