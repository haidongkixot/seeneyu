'use client'

import { useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'

interface FollowButtonProps {
  userId: string
  initialFollowing?: boolean
}

export function FollowButton({ userId, initialFollowing = false }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggleFollow() {
    setLoading(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const res = await fetch('/api/gamification/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        const data = await res.json()
        setFollowing(data.following)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${
        following
          ? 'bg-bg-inset text-text-secondary hover:bg-red-500/10 hover:text-red-400 border border-black/8'
          : 'bg-accent-400 text-bg-base hover:bg-accent-300'
      }`}
    >
      {following ? (
        <>
          <UserMinus size={12} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={12} />
          Follow
        </>
      )}
    </button>
  )
}
