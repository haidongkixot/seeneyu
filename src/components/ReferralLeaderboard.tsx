'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  conversions: number
  reward: string
}

const RANK_STYLES: Record<number, { bg: string; text: string; icon: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🥇' },
  2: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '🥈' },
  3: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🥉' },
}

export function ReferralLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral/leaderboard')
      .then(r => r.json())
      .then(data => setEntries(data.leaderboard ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-black/8">
        <Trophy size={18} className="text-accent-400" />
        <h3 className="text-sm font-bold text-text-primary">Top Referrers</h3>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-bg-base animate-pulse rounded-lg" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-text-tertiary">
          No referrals yet — be the first!
        </div>
      ) : (
        <div className="divide-y divide-black/5">
          {entries.map(entry => {
            const style = RANK_STYLES[entry.rank]
            return (
              <div key={entry.rank} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${style?.bg ?? 'bg-bg-base'} ${style?.text ?? 'text-text-tertiary'}`}>
                  {style?.icon ?? `#${entry.rank}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{entry.name}</p>
                  <p className="text-xs text-text-tertiary">{entry.reward} earned</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-accent-400">{entry.conversions}</p>
                  <p className="text-xs text-text-tertiary">referrals</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
