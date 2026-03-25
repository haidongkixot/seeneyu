'use client'

import { useEffect, useMemo } from 'react'
import { Flame, Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BadgeCard } from './BadgeCard'

type CelebrationType = 'level-up' | 'badge' | 'streak' | 'perfect-score'

interface CelebrationOverlayProps {
  type: CelebrationType
  data: any
  onDismiss: () => void
}

function ConfettiParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1.5}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
        color: ['bg-accent-400', 'bg-accent-300', 'bg-amber-300', 'bg-yellow-200', 'bg-orange-400'][
          Math.floor(Math.random() * 5)
        ],
        size: `${4 + Math.random() * 6}px`,
      })),
    []
  )

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className={cn('absolute rounded-sm', p.color)}
          style={{
            left: p.left,
            top: 0,
            width: p.size,
            height: p.size,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </>
  )
}

function StarBurst() {
  const stars = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (360 / 12) * i,
        delay: `${i * 0.08}s`,
      })),
    []
  )

  return (
    <>
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `rotate(${s.angle}deg) translateY(-60px)`,
            animation: `star-burst 1.2s ${s.delay} ease-out forwards`,
          }}
        >
          <Star size={16} className="text-accent-300" fill="currentColor" />
        </div>
      ))}
    </>
  )
}

export function CelebrationOverlay({ type, data, onDismiss }: CelebrationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
      onClick={onDismiss}
    >
      {/* Confetti for level-up */}
      {type === 'level-up' && <ConfettiParticles />}

      {/* Star particles for perfect-score */}
      {type === 'perfect-score' && <StarBurst />}

      {/* Center content */}
      <div className="animate-bounce-in text-center" onClick={(e) => e.stopPropagation()}>
        {type === 'level-up' && (
          <>
            <div className="text-7xl font-bold text-accent-400 mb-2 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              {data?.level}
            </div>
            <div className="text-2xl font-bold text-text-primary tracking-wide">
              LEVEL UP!
            </div>
          </>
        )}

        {type === 'badge' && data?.badge && (
          <div className="w-64 animate-badge-reveal">
            <BadgeCard badge={data.badge} earned earnedAt={new Date().toISOString()} />
          </div>
        )}

        {type === 'streak' && (
          <>
            <Flame
              size={72}
              className="text-accent-400 mx-auto mb-3 animate-flame-flicker drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              fill="currentColor"
            />
            <div className="text-2xl font-bold text-text-primary">
              {data?.streak}-day streak!
            </div>
          </>
        )}

        {type === 'perfect-score' && (
          <>
            <Star
              size={64}
              className="text-accent-300 mx-auto mb-3 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              fill="currentColor"
            />
            <div className="text-2xl font-bold text-text-primary">
              Perfect Score!
            </div>
          </>
        )}
      </div>
    </div>
  )
}
