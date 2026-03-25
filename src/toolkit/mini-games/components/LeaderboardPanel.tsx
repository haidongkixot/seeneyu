'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  date: string
}

interface LeaderboardPanelProps {
  gameType: string
  currentScore?: number
  currentRank?: number
}

// Demo data for now; replace with API call later
function generateDemoLeaderboard(gameType: string): LeaderboardEntry[] {
  const names = [
    'Alex K.', 'Maria S.', 'James T.', 'Sofia L.', 'Chen W.',
    'Emma R.', 'Omar F.', 'Yuki M.', 'Lucas B.', 'Priya D.',
    'Noah C.', 'Ava P.', 'Liam H.', 'Mia J.', 'Ethan G.',
    'Isabella N.', 'Mason V.', 'Amelia Q.', 'Logan X.', 'Harper Z.',
  ]

  return names.map((name, i) => ({
    rank: i + 1,
    name,
    score: Math.max(300 - i * 12 - Math.floor(Math.random() * 10), 50),
    date: '2026-03-25',
  }))
}

function getRankIcon(rank: number) {
  if (rank === 1) return <span className="text-base">🥇</span>
  if (rank === 2) return <span className="text-base">🥈</span>
  if (rank === 3) return <span className="text-base">🥉</span>
  return <span className="text-xs text-text-tertiary font-mono w-5 text-center">{rank}</span>
}

export default function LeaderboardPanel({
  gameType,
  currentScore,
  currentRank,
}: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setEntries(generateDemoLeaderboard(gameType))
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [gameType])

  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-accent-400" />
          <h3 className="text-sm font-semibold text-text-primary">Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-accent-400" />
        <h3 className="text-sm font-semibold text-text-primary">Leaderboard</h3>
      </div>

      {/* Current player highlight */}
      {currentScore !== undefined && currentRank !== undefined && (
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-accent-400/10 border border-accent-400/30 flex items-center gap-3">
          <span className="text-xs text-accent-400 font-mono font-bold">#{currentRank}</span>
          <span className="text-sm font-semibold text-accent-400 flex-1">You</span>
          <span className="text-sm font-bold text-accent-400 font-mono">{currentScore}</span>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
        {entries.map((entry) => {
          const isCurrentPlayer = currentRank !== undefined && entry.rank === currentRank
          return (
            <div
              key={entry.rank}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                ${isCurrentPlayer ? 'bg-accent-400/10 border border-accent-400/20' : 'hover:bg-bg-surface'}
                ${entry.rank <= 3 ? 'bg-bg-surface' : ''}
              `}
            >
              <div className="w-6 flex-shrink-0 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <span
                className={`text-sm flex-1 truncate ${
                  isCurrentPlayer ? 'font-semibold text-accent-400' : 'text-text-primary'
                }`}
              >
                {isCurrentPlayer ? 'You' : entry.name}
              </span>
              <span
                className={`text-sm font-mono font-bold ${
                  isCurrentPlayer ? 'text-accent-400' : 'text-text-secondary'
                }`}
              >
                {entry.score}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
