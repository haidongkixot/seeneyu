'use client'

import { useState, useEffect } from 'react'
import { StreakFlame } from './StreakFlame'
import { HeartCounter } from './HeartCounter'
import { LevelBadge } from './LevelBadge'
import { Zap } from 'lucide-react'

interface GamificationProfile {
  level: number
  currentXp: number
  xpForNextLevel: number
  streak: number
  hearts: number
  unlimited: boolean
}

export function GamificationBar() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null)

  useEffect(() => {
    fetch('/api/gamification/profile')
      .then((r) => {
        if (!r.ok) throw new Error('Not authenticated')
        return r.json()
      })
      .then(setProfile)
      .catch(() => {
        // Not authenticated or endpoint missing — silently hide
      })
  }, [])

  if (!profile) return null

  const progress = profile.xpForNextLevel > 0
    ? profile.currentXp / profile.xpForNextLevel
    : 0

  return (
    <div className="flex items-center gap-3">
      <StreakFlame streak={profile.streak} />
      <HeartCounter hearts={profile.hearts} unlimited={profile.unlimited} />

      {/* XP mini display */}
      <div className="flex items-center gap-1 text-xs text-accent-400 font-semibold">
        <Zap size={12} fill="currentColor" />
        <span>{profile.currentXp}</span>
      </div>

      <LevelBadge level={profile.level} progress={progress} />
    </div>
  )
}
