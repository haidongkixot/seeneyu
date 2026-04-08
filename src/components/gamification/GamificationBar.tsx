'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { StreakFlame } from './StreakFlame'
import { HeartCounter } from './HeartCounter'
import { LevelBadge } from './LevelBadge'
import { TierBadge } from './TierBadge'
import { Zap } from 'lucide-react'

type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'

function getTierForXp(totalXp: number): TierName {
  if (totalXp >= 50000) return 'Diamond'
  if (totalXp >= 15000) return 'Platinum'
  if (totalXp >= 5000) return 'Gold'
  if (totalXp >= 1000) return 'Silver'
  return 'Bronze'
}

interface GamificationProfile {
  level: number
  currentXp: number
  xpForNextLevel: number
  streak: number
  hearts: number
  unlimited: boolean
  totalXp?: number
}

export function GamificationBar() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null)
  const pathname = usePathname()

  const fetchProfile = useCallback(() => {
    fetch('/api/gamification/profile', { credentials: 'include', cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Not authenticated')
        return r.json()
      })
      .then(setProfile)
      .catch(() => {
        // Not authenticated or endpoint missing — silently hide
      })
  }, [])

  // Refetch on mount + every route change (catches XP awards from any page action)
  useEffect(() => {
    fetchProfile()
  }, [pathname, fetchProfile])

  // Refetch on custom 'xp:awarded' window event (fired by client code after actions)
  useEffect(() => {
    const handler = () => fetchProfile()
    window.addEventListener('xp:awarded', handler)
    // Also refetch when tab regains focus (catches background XP awards)
    window.addEventListener('focus', handler)
    return () => {
      window.removeEventListener('xp:awarded', handler)
      window.removeEventListener('focus', handler)
    }
  }, [fetchProfile])

  if (!profile) return null

  const progress = profile.xpForNextLevel > 0
    ? profile.currentXp / profile.xpForNextLevel
    : 0

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <StreakFlame streak={profile.streak} />
      <HeartCounter hearts={profile.hearts} unlimited={profile.unlimited} />

      {/* XP mini display — hidden on mobile to save space */}
      <div className="hidden md:flex items-center gap-1 text-xs text-accent-400 font-semibold">
        <Zap size={12} fill="currentColor" />
        <span>{profile.currentXp}</span>
      </div>

      <LevelBadge level={profile.level} progress={progress} />
      {profile.totalXp !== undefined && (
        <span className="hidden md:inline-flex">
          <TierBadge tier={getTierForXp(profile.totalXp)} />
        </span>
      )}
    </div>
  )
}
