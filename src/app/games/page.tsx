'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Gamepad2, Play, Trophy, Copy, Check, Eye, Shuffle, Crown,
  ChevronRight, Clock, Search,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface GameData {
  id: string
  type: string
  title: string
  description: string
  config: any
  roundCount: number
  totalPlays: number
}

interface LeaderboardEntry {
  playerName: string
  score: number
  completedAt: string
}

const GAME_META: Record<string, {
  icon: typeof Eye
  color: string
  badge?: string
  playPath: string
}> = {
  guess_expression: {
    icon: Eye,
    color: 'from-blue-500/20 to-blue-600/5',
    playPath: '/games/guess-expression',
  },
  match_expression: {
    icon: Shuffle,
    color: 'from-purple-500/20 to-purple-600/5',
    playPath: '/games/match-expression',
  },
  expression_king: {
    icon: Crown,
    color: 'from-pink-500/20 to-pink-600/5',
    badge: 'Earn Certificate!',
    playPath: '/games/expression-king',
  },
  emotion_timeline: {
    icon: Clock,
    color: 'from-amber-500/20 to-amber-600/5',
    playPath: '/games/emotion-timeline',
  },
  spot_the_signal: {
    icon: Search,
    color: 'from-emerald-500/20 to-emerald-600/5',
    badge: 'Fast-paced!',
    playPath: '/games/spot-the-signal',
  },
}

interface UserPrefs {
  genres: string[]
  purposes: string[]
  traits: string[]
}

function matchesGamePrefs(game: GameData, prefs: UserPrefs): boolean {
  const text = `${game.title} ${game.description} ${game.type}`.toLowerCase()
  const allKeywords = [...prefs.traits, ...prefs.purposes, ...prefs.genres]
  return allKeywords.some(kw => text.includes(kw.replace(/-/g, ' ').toLowerCase()))
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function GamesPage() {
  const [games, setGames] = useState<GameData[]>([])
  const [loading, setLoading] = useState(true)
  const [leaderboardType, setLeaderboardType] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbLoading, setLbLoading] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const [recommendedTypes, setRecommendedTypes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/preferences')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error) setPrefs(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/public/games')
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data) ? data : []
        setGames(items)
        if (items.length > 0) {
          setLeaderboardType(items[0].type)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!prefs || games.length === 0) return
    const allKeywords = [...prefs.traits, ...prefs.purposes, ...prefs.genres]
    if (allKeywords.length === 0) return
    const types = new Set<string>()
    for (const g of games) {
      if (matchesGamePrefs(g, prefs)) types.add(g.type)
    }
    setRecommendedTypes(types)
  }, [prefs, games])

  const sortedGames = [...games].sort((a, b) => {
    const aRec = recommendedTypes.has(a.type) ? 1 : 0
    const bRec = recommendedTypes.has(b.type) ? 1 : 0
    return bRec - aRec
  })

  useEffect(() => {
    if (!leaderboardType) return
    setLbLoading(true)
    fetch(`/api/public/games/leaderboard/${leaderboardType}`)
      .then(r => r.json())
      .then(data => {
        setLeaderboard(data.leaderboard ?? [])
        setLbLoading(false)
      })
      .catch(() => setLbLoading(false))
  }, [leaderboardType])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seeneyu.com'

  function copyEmbed() {
    const code = `<iframe src="${origin}/embed/games/guess-expression" width="100%" height="600" frameborder="0" allow="camera; microphone" allowfullscreen></iframe>`
    navigator.clipboard.writeText(code)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 size={24} className="text-accent-400" />
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
              Mini-Games
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            Play games, earn XP, and help train our AI
          </p>
        </div>

        {/* Game Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-60 rounded-2xl skeleton" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary mb-12">
            <Gamepad2 size={48} className="mx-auto mb-4 opacity-30" />
            <p>No games available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {sortedGames.map(game => {
              const meta = GAME_META[game.type]
              if (!meta) return null
              const Icon = meta.icon

              return (
                <div
                  key={game.id}
                  className="group relative flex flex-col rounded-2xl bg-bg-surface border border-black/8 overflow-hidden hover:border-accent-400/20 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Gradient header */}
                  <div className={`h-24 bg-gradient-to-br ${meta.color} flex items-center justify-center relative`}>
                    <Icon size={40} className="text-white/60" />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {recommendedTypes.has(game.type) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-400/10 text-accent-400 border border-accent-400/30">
                          Recommended
                        </span>
                      )}
                      {meta.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-400 text-bg-base">
                          {meta.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-lg font-bold text-text-primary mb-1">{game.title}</h3>
                    <p className="text-sm text-text-secondary mb-4 flex-1">{game.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Play size={10} /> {game.totalPlays} plays
                        </span>
                        <span className="flex items-center gap-1">
                          {game.roundCount} rounds
                        </span>
                      </div>
                    </div>

                    <Link
                      href={meta.playPath}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold bg-accent-400 text-bg-base rounded-xl hover:bg-accent-300 transition-colors"
                    >
                      <Play size={14} /> Play
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Leaderboard Section */}
        {games.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-accent-400" />
              <h2 className="text-xl font-bold text-text-primary">Leaderboard</h2>
            </div>

            {/* Game type tabs */}
            <div className="flex items-center gap-1 bg-bg-inset rounded-xl p-1 w-fit mb-4">
              {games.map(game => (
                <button
                  key={game.type}
                  onClick={() => setLeaderboardType(game.type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                    leaderboardType === game.type
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {game.title}
                </button>
              ))}
            </div>

            <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
              {lbLoading ? (
                <div className="text-center py-12 text-text-muted">Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-text-muted">No scores yet. Be the first to play!</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/8">
                      <th className="text-left px-4 py-3 text-text-secondary font-medium w-12">#</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Player</th>
                      <th className="text-right px-4 py-3 text-text-secondary font-medium">Score</th>
                      <th className="text-right px-4 py-3 text-text-secondary font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.slice(0, 10).map((entry, i) => (
                      <tr key={i} className="border-b border-black/[0.04] hover:bg-bg-overlay transition-colors">
                        <td className="px-4 py-3 text-text-muted">
                          {i === 0 ? (
                            <span className="text-accent-400 font-bold">1</span>
                          ) : i === 1 ? (
                            <span className="text-gray-300 font-bold">2</span>
                          ) : i === 2 ? (
                            <span className="text-amber-600 font-bold">3</span>
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-primary font-medium">{entry.playerName || 'Anonymous'}</td>
                        <td className="px-4 py-3 text-right text-accent-400 font-bold">{entry.score}</td>
                        <td className="px-4 py-3 text-right text-text-muted text-xs">
                          {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Embed Code Section */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">Put this game on your website</h2>
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <p className="text-sm text-text-secondary mb-3">
              Copy the embed code below and paste it into your website HTML:
            </p>
            <div className="relative">
              <pre className="bg-bg-inset border border-black/10 rounded-xl p-4 text-xs text-text-muted overflow-x-auto">
{`<iframe
  src="${origin}/embed/games/guess-expression"
  width="100%" height="600"
  frameborder="0"
  allow="camera; microphone"
  allowfullscreen
></iframe>`}
              </pre>
              <button
                onClick={copyEmbed}
                className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-xs font-medium bg-bg-surface border border-black/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                {copiedEmbed ? (
                  <><Check size={12} className="text-emerald-400" /> Copied</>
                ) : (
                  <><Copy size={12} /> Copy</>
                )}
              </button>
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              Replace <code className="text-accent-400">guess-expression</code> with{' '}
              <code className="text-accent-400">match-expression</code> or{' '}
              <code className="text-accent-400">expression-king</code> for other games.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
