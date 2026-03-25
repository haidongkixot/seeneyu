'use client'

import { useState, useEffect } from 'react'
import { Users, Zap, Award } from 'lucide-react'

interface FeedItem {
  id: string
  type: 'xp_gain' | 'badge_earned'
  userId: string
  userName: string
  userImage: string | null
  description: string
  timestamp: string
}

function relativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gamification/feed')
      .then((r) => {
        if (!r.ok) throw new Error('Not authenticated')
        return r.json()
      })
      .then((data) => {
        setItems(data.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
        <div className="text-center text-text-muted text-sm">Loading feed...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-8 text-center">
        <Users size={32} className="mx-auto mb-3 text-text-muted opacity-30" />
        <p className="text-text-secondary text-sm mb-1">No activity yet</p>
        <p className="text-text-muted text-xs">
          Follow other learners to see their achievements here
        </p>
      </div>
    )
  }

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
      <div className="divide-y divide-black/[0.04]">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-bg-overlay transition-colors">
            {/* Avatar */}
            {item.userImage ? (
              <img
                src={item.userImage}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-bg-inset flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0 mt-0.5">
                {(item.userName || '?')[0].toUpperCase()}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">
                <span className="font-semibold">{item.userName}</span>{' '}
                <span className="text-text-secondary">{item.description}</span>
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">{relativeTime(item.timestamp)}</p>
            </div>

            {/* Type icon */}
            <div className="flex-shrink-0 mt-1">
              {item.type === 'xp_gain' ? (
                <Zap size={14} className="text-accent-400" />
              ) : (
                <Award size={14} className="text-purple-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
