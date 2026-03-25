'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { TierBadge } from './TierBadge'

type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  image: string | null
  weeklyXp: number
  totalXp: number
  level: number
}

interface LeaderboardData {
  type: string
  period: string
  entries: LeaderboardEntry[]
  userRank: number | null
  userId: string | null
}

const TIER_THRESHOLDS: { name: TierName; minXp: number }[] = [
  { name: 'Diamond', minXp: 50000 },
  { name: 'Platinum', minXp: 15000 },
  { name: 'Gold', minXp: 5000 },
  { name: 'Silver', minXp: 1000 },
  { name: 'Bronze', minXp: 0 },
]

function getTier(totalXp: number): TierName {
  for (const t of TIER_THRESHOLDS) {
    if (totalXp >= t.minXp) return t.name
  }
  return 'Bronze'
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={16} className="text-yellow-400" />
  if (rank === 2) return <Medal size={16} className="text-gray-300" />
  if (rank === 3) return <Medal size={16} className="text-amber-600" />
  return <span className="text-text-muted text-sm">{rank}</span>
}

export function LeaderboardTable() {
  const [tab, setTab] = useState<'week' | 'all'>('week')
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const type = tab === 'week' ? 'weekly_xp' : 'all_time_xp'
    const period = tab === 'week' ? 'current' : 'all'
    fetch(`/api/gamification/leaderboard?type=${type}&period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tab])

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-3 border-b border-black/8">
        <button
          onClick={() => setTab('week')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            tab === 'week'
              ? 'bg-accent-400/10 text-accent-400'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            tab === 'all'
              ? 'bg-accent-400/10 text-accent-400'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">Loading...</div>
      ) : !data?.entries?.length ? (
        <div className="text-center py-12 text-text-muted text-sm">
          <Trophy size={32} className="mx-auto mb-2 opacity-30" />
          No leaderboard data yet
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/8">
              <th className="text-left px-4 py-2.5 text-text-secondary font-medium w-12">#</th>
              <th className="text-left px-4 py-2.5 text-text-secondary font-medium">Player</th>
              <th className="text-center px-4 py-2.5 text-text-secondary font-medium">Level</th>
              <th className="text-center px-4 py-2.5 text-text-secondary font-medium">Tier</th>
              <th className="text-right px-4 py-2.5 text-text-secondary font-medium">XP</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry) => {
              const isCurrentUser = entry.userId === data.userId
              return (
                <tr
                  key={entry.userId}
                  className={`border-b border-black/[0.04] transition-colors ${
                    isCurrentUser
                      ? 'bg-accent-400/5 border-l-2 border-l-accent-400'
                      : 'hover:bg-bg-overlay'
                  }`}
                >
                  <td className="px-4 py-2.5 w-12">
                    <RankIcon rank={entry.rank} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {entry.image ? (
                        <img
                          src={entry.image}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-bg-inset flex items-center justify-center text-[10px] font-bold text-text-muted">
                          {(entry.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className={`font-medium ${isCurrentUser ? 'text-accent-400' : 'text-text-primary'}`}>
                        {entry.name}
                        {isCurrentUser && <span className="text-[10px] ml-1 opacity-60">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center text-text-secondary">{entry.level}</td>
                  <td className="px-4 py-2.5 text-center">
                    <TierBadge tier={getTier(entry.totalXp)} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-accent-400">
                    {(tab === 'week' ? entry.weeklyXp : entry.totalXp).toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* User's rank if not in top 50 */}
      {data?.userRank && data.userRank > 50 && (
        <div className="px-4 py-3 border-t border-black/8 text-sm text-text-secondary">
          Your rank: <span className="text-accent-400 font-bold">#{data.userRank}</span>
        </div>
      )}
    </div>
  )
}
