'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X,
  Gamepad2, Users, BarChart3, ImageIcon, CheckCircle2, XCircle, Clock,
  Eye, Trophy, Target, Percent,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface MiniGame {
  id: string
  type: string
  title: string
  description: string
  isActive: boolean
  config: any
  createdAt: string
  _count: { rounds: number; sessions: number }
  stats: { totalSessions: number; totalRounds: number; avgScore: number; activePlayers: number }
}

interface MiniGameRound {
  id: string
  gameId: string
  orderIndex: number
  prompt: string
  imageUrl: string | null
  correctAnswer: string | null
  options: string[] | null
}

interface GameSession {
  id: string
  gameId: string
  game: { type: string; title: string }
  playerId: string | null
  playerName: string | null
  score: number
  totalRounds: number
  responses: any
  completedAt: string | null
  createdAt: string
}

interface Submission {
  id: string
  sessionId: string | null
  challengeLabel: string
  imageUrl: string
  aiScore: number | null
  aiAnalysis: string | null
  status: string
  createdAt: string
}

interface Analytics {
  totalPlays: number
  completedPlays: number
  completionRate: number
  avgScoresByGame: { gameId: string; game: { type: string; title: string } | null; avgScore: number; sessionsCount: number }[]
  dailyPlays: { date: string; count: number }[]
  topPlayers: { playerName: string; totalScore: number; gamesPlayed: number }[]
  submissionsByStatus: Record<string, number>
}

type Tab = 'games' | 'sessions' | 'submissions' | 'analytics'

const GAME_TYPES = [
  { value: 'guess_expression', label: 'Guess the Expression' },
  { value: 'match_expression', label: 'Match the Expression' },
  { value: 'expression_king', label: 'Expression King' },
]

// ── Badges ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-accent-400/20 text-accent-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    guess_expression: 'bg-blue-500/15 text-blue-400',
    match_expression: 'bg-purple-500/15 text-purple-400',
    expression_king: 'bg-pink-500/15 text-pink-400',
  }
  const labels: Record<string, string> = {
    guess_expression: 'Guess',
    match_expression: 'Match',
    expression_king: 'King',
  }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[type] || 'bg-bg-inset text-text-muted'}`}>
      {labels[type] || type}
    </span>
  )
}

// ── Score color helper ──────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return 'text-text-muted'
  if (score >= 80) return 'text-emerald-400'
  if (score >= 50) return 'text-accent-400'
  return 'text-red-400'
}

// ── Create/Edit Game Form ───────────────────────────────────────────────

function GameForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: MiniGame
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState(initial?.type ?? 'guess_expression')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const url = initial
      ? `/api/admin/toolkit/mini-games/${initial.id}`
      : '/api/admin/toolkit/mini-games'
    const method = initial ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, description }),
    })

    if (res.ok) {
      onSaved()
      onClose()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save game')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {initial ? 'Edit Game' : 'Create Game'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initial && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              >
                {GAME_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-sm font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initial ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Round Form ──────────────────────────────────────────────────────

function AddRoundForm({
  gameId,
  onClose,
  onSaved,
}: {
  gameId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const options = optionsText.trim()
      ? optionsText.split(',').map(o => o.trim()).filter(Boolean)
      : null

    const res = await fetch(`/api/admin/toolkit/mini-games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        imageUrl: imageUrl || null,
        correctAnswer: correctAnswer || null,
        options,
      }),
    })

    if (res.ok) {
      onSaved()
      onClose()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to add round')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-inset border border-white/8 rounded-xl p-4 mt-2 space-y-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Prompt</label>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          required
          placeholder="What expression is this person showing?"
          className="w-full bg-bg-base border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Image URL (optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-bg-base border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Correct Answer</label>
          <input
            type="text"
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
            placeholder="happiness"
            className="w-full bg-bg-base border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Options (comma separated)</label>
        <input
          type="text"
          value={optionsText}
          onChange={e => setOptionsText(e.target.value)}
          placeholder="happiness, sadness, anger, surprise"
          className="w-full bg-bg-base border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-xs text-text-muted hover:text-text-secondary rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1 text-xs font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Round'}
        </button>
      </div>
    </form>
  )
}

// ── Rounds List Inline ──────────────────────────────────────────────────

function RoundsList({ gameId }: { gameId: string }) {
  const [rounds, setRounds] = useState<MiniGameRound[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRounds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/toolkit/mini-games/${gameId}/rounds`)
      const data = await res.json()
      setRounds(data.items ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [gameId])

  useEffect(() => { fetchRounds() }, [fetchRounds])

  async function deleteRound(roundId: string) {
    if (!confirm('Delete this round?')) return
    setActionLoading(roundId)
    await fetch(`/api/admin/toolkit/mini-games/rounds/${roundId}`, { method: 'DELETE' })
    fetchRounds()
    setActionLoading(null)
  }

  return (
    <div className="mt-2 pl-12">
      {loading ? (
        <p className="text-xs text-text-muted py-2">Loading rounds...</p>
      ) : rounds.length === 0 ? (
        <p className="text-xs text-text-muted py-2">No rounds yet.</p>
      ) : (
        <div className="space-y-1">
          {rounds.map((round, idx) => (
            <div key={round.id} className="flex items-center gap-3 bg-bg-inset rounded-lg px-3 py-2 text-xs">
              <span className="text-text-muted w-5 text-right">#{idx + 1}</span>
              <span className="text-text-primary flex-1 truncate">{round.prompt}</span>
              {round.correctAnswer && (
                <span className="text-emerald-400 text-[10px]">{round.correctAnswer}</span>
              )}
              {round.options && (
                <span className="text-text-muted text-[10px]">{(round.options as string[]).length} options</span>
              )}
              <button
                onClick={() => deleteRound(round.id)}
                disabled={actionLoading === round.id}
                className="text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddForm ? (
        <AddRoundForm
          gameId={gameId}
          onClose={() => setShowAddForm(false)}
          onSaved={fetchRounds}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 mt-2 px-2 py-1 text-[11px] text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
        >
          <Plus size={11} /> Add Round
        </button>
      )}
    </div>
  )
}

// ── Submission Viewer Modal ─────────────────────────────────────────────

function SubmissionViewer({
  submission,
  onClose,
}: {
  submission: Submission
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Submission Detail</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={18} />
          </button>
        </div>

        <div className="aspect-video bg-bg-inset rounded-xl overflow-hidden mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={submission.imageUrl}
            alt={submission.challengeLabel}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Challenge:</span>
            <span className="text-text-primary font-medium capitalize">{submission.challengeLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">AI Score:</span>
            <span className={`font-bold ${scoreColor(submission.aiScore)}`}>
              {submission.aiScore !== null ? `${submission.aiScore}/100` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Status:</span>
            <StatusBadge status={submission.status} />
          </div>
          {submission.aiAnalysis && (
            <div className="mt-3">
              <p className="text-xs font-medium text-text-secondary mb-1">AI Analysis</p>
              <p className="text-xs text-text-muted bg-bg-inset rounded-lg p-3">{submission.aiAnalysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function AdminMiniGamesPage() {
  const [tab, setTab] = useState<Tab>('games')

  // Games state
  const [games, setGames] = useState<MiniGame[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [showGameForm, setShowGameForm] = useState(false)
  const [editingGame, setEditingGame] = useState<MiniGame | undefined>(undefined)
  const [expandedGame, setExpandedGame] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Sessions state
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionGameFilter, setSessionGameFilter] = useState('all')
  const [sessionPage, setSessionPage] = useState(1)
  const [sessionPages, setSessionPages] = useState(1)
  const [sessionTotal, setSessionTotal] = useState(0)

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [submStatusFilter, setSubmStatusFilter] = useState('all')
  const [submPage, setSubmPage] = useState(1)
  const [submPages, setSubmPages] = useState(1)
  const [submTotal, setSubmTotal] = useState(0)
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null)

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  // ── Fetch functions ──

  const fetchGames = useCallback(async () => {
    setGamesLoading(true)
    try {
      const res = await fetch('/api/admin/toolkit/mini-games')
      const data = await res.json()
      setGames(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setGamesLoading(false)
  }, [])

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    const params = new URLSearchParams({ page: String(sessionPage) })
    if (sessionGameFilter !== 'all') params.set('gameType', sessionGameFilter)
    params.set('completed', 'true')

    try {
      const res = await fetch(`/api/admin/toolkit/mini-games/sessions?${params}`)
      const data = await res.json()
      setSessions(data.items ?? [])
      setSessionPages(data.pages ?? 1)
      setSessionTotal(data.total ?? 0)
    } catch { /* ignore */ }
    setSessionsLoading(false)
  }, [sessionPage, sessionGameFilter])

  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true)
    const params = new URLSearchParams({ page: String(submPage) })
    if (submStatusFilter !== 'all') params.set('status', submStatusFilter)

    try {
      const res = await fetch(`/api/admin/toolkit/mini-games/submissions?${params}`)
      const data = await res.json()
      setSubmissions(data.items ?? [])
      setSubmPages(data.pages ?? 1)
      setSubmTotal(data.total ?? 0)
    } catch { /* ignore */ }
    setSubmissionsLoading(false)
  }, [submPage, submStatusFilter])

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/admin/toolkit/mini-games/analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch { /* ignore */ }
    setAnalyticsLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'games') fetchGames()
    else if (tab === 'sessions') fetchSessions()
    else if (tab === 'submissions') fetchSubmissions()
    else if (tab === 'analytics') fetchAnalytics()
  }, [tab, fetchGames, fetchSessions, fetchSubmissions, fetchAnalytics])

  // ── Game actions ──

  async function toggleActive(game: MiniGame) {
    setActionLoading(game.id)
    await fetch(`/api/admin/toolkit/mini-games/${game.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !game.isActive }),
    })
    fetchGames()
    setActionLoading(null)
  }

  async function deleteGame(id: string) {
    if (!confirm('Delete this game and all its rounds/sessions?')) return
    setActionLoading(id)
    await fetch(`/api/admin/toolkit/mini-games/${id}`, { method: 'DELETE' })
    fetchGames()
    setActionLoading(null)
  }

  // ── Submission actions ──

  async function updateSubmissionStatus(id: string, status: string) {
    setActionLoading(id)
    await fetch(`/api/admin/toolkit/mini-games/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchSubmissions()
    setActionLoading(null)
  }

  // ── Tab config ──

  const tabs: { value: Tab; label: string; Icon: typeof Gamepad2 }[] = [
    { value: 'games', label: 'Games', Icon: Gamepad2 },
    { value: 'sessions', label: 'Sessions', Icon: Users },
    { value: 'submissions', label: 'Submissions', Icon: ImageIcon },
    { value: 'analytics', label: 'Analytics', Icon: BarChart3 },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/toolkit" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3">
          <ArrowLeft size={12} /> Back to Toolkit
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Mini-Games</h1>
            <p className="text-text-secondary text-sm mt-1">
              Manage interactive mini-games, sessions, and expression submissions.
            </p>
          </div>
          {tab === 'games' && (
            <button
              onClick={() => { setEditingGame(undefined); setShowGameForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-xl hover:bg-accent-300 transition-colors"
            >
              <Plus size={14} /> Create Game
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-bg-inset rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              tab === t.value
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <t.Icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Games Tab ── */}
      {tab === 'games' && (
        <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Game</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Type</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Active</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Rounds</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Sessions</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Avg Score</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gamesLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-muted">Loading...</td></tr>
              ) : games.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-muted">No games yet. Create one to get started.</td></tr>
              ) : (
                games.map(game => (
                  <>
                    <tr key={game.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-text-primary font-medium">{game.title}</p>
                        <p className="text-[11px] text-text-muted truncate max-w-[260px]">{game.description}</p>
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={game.type} /></td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(game)}
                          disabled={actionLoading === game.id}
                          className="inline-flex items-center justify-center disabled:opacity-50"
                          title={game.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                        >
                          {game.isActive ? (
                            <ToggleRight size={20} className="text-emerald-400" />
                          ) : (
                            <ToggleLeft size={20} className="text-text-muted" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">{game.stats.totalRounds}</td>
                      <td className="px-4 py-3 text-center text-text-secondary">{game.stats.totalSessions}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={scoreColor(game.stats.avgScore)}>
                          {game.stats.avgScore > 0 ? Math.round(game.stats.avgScore) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-text-muted hover:text-text-secondary hover:bg-bg-overlay rounded-lg transition-colors"
                            title="Rounds"
                          >
                            {expandedGame === game.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            Rounds
                          </button>
                          <button
                            onClick={() => { setEditingGame(game); setShowGameForm(true) }}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => deleteGame(game.id)}
                            disabled={actionLoading === game.id}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedGame === game.id && (
                      <tr key={`${game.id}-rounds`}>
                        <td colSpan={7} className="px-4 pb-4 bg-bg-overlay/50">
                          <RoundsList gameId={game.id} />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sessions Tab ── */}
      {tab === 'sessions' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
              <button
                onClick={() => { setSessionGameFilter('all'); setSessionPage(1) }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  sessionGameFilter === 'all'
                    ? 'bg-bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                All Types
              </button>
              {GAME_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setSessionGameFilter(t.value); setSessionPage(1) }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                    sessionGameFilter === t.value
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Game</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Player</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium">Score</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium">Rounds</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {sessionsLoading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-text-muted">Loading...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-text-muted">No sessions found.</td></tr>
                ) : (
                  sessions.map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TypeBadge type={s.game.type} />
                          <span className="text-text-primary text-xs">{s.game.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {s.playerName || 'Anonymous'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">{s.totalRounds}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {sessionPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <span className="text-xs text-text-muted">{sessionTotal} total</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                    disabled={sessionPage === 1}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-text-secondary px-2">{sessionPage} / {sessionPages}</span>
                  <button
                    onClick={() => setSessionPage(p => Math.min(sessionPages, p + 1))}
                    disabled={sessionPage === sessionPages}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Submissions Tab ── */}
      {tab === 'submissions' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => { setSubmStatusFilter(s); setSubmPage(1) }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize ${
                    submStatusFilter === s
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
            {submissionsLoading ? (
              <div className="text-center py-12 text-text-muted">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-text-muted">No submissions found.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {submissions.map(sub => (
                  <div key={sub.id} className="bg-bg-overlay border border-white/5 rounded-xl overflow-hidden group">
                    <div
                      className="aspect-square bg-bg-inset relative cursor-pointer"
                      onClick={() => setViewingSubmission(sub)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sub.imageUrl}
                        alt={sub.challengeLabel}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white capitalize">
                          {sub.challengeLabel}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                        <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${scoreColor(sub.aiScore)}`}>
                          {sub.aiScore !== null ? `${sub.aiScore}/100` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                        {sub.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateSubmissionStatus(sub.id, 'approved')}
                              disabled={actionLoading === sub.id}
                              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={10} /> Approve
                            </button>
                            <button
                              onClick={() => updateSubmissionStatus(sub.id, 'rejected')}
                              disabled={actionLoading === sub.id}
                              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                            >
                              <XCircle size={10} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {submPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <span className="text-xs text-text-muted">{submTotal} total</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSubmPage(p => Math.max(1, p - 1))}
                    disabled={submPage === 1}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-text-secondary px-2">{submPage} / {submPages}</span>
                  <button
                    onClick={() => setSubmPage(p => Math.min(submPages, p + 1))}
                    disabled={submPage === submPages}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Analytics Tab ── */}
      {tab === 'analytics' && (
        <>
          {analyticsLoading ? (
            <div className="text-center py-12 text-text-muted">Loading analytics...</div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Target size={18} />}
                  label="Total Plays"
                  value={analytics.totalPlays}
                />
                <StatCard
                  icon={<Percent size={18} />}
                  label="Completion Rate"
                  value={`${Math.round(analytics.completionRate * 100)}%`}
                />
                <StatCard
                  icon={<Trophy size={18} />}
                  label="Avg Score"
                  value={
                    analytics.avgScoresByGame.length > 0
                      ? Math.round(
                          analytics.avgScoresByGame.reduce((s, g) => s + g.avgScore, 0) /
                            analytics.avgScoresByGame.length
                        )
                      : 0
                  }
                />
                <StatCard
                  icon={<ImageIcon size={18} />}
                  label="Submissions"
                  value={Object.values(analytics.submissionsByStatus).reduce((s, c) => s + c, 0)}
                />
              </div>

              {/* Daily Plays Table */}
              <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <h3 className="text-sm font-semibold text-text-primary">Daily Plays (Last 30 Days)</h3>
                </div>
                {analytics.dailyPlays.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-sm">No play data yet.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-2 text-text-secondary font-medium">Date</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">Plays</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.dailyPlays.map(d => (
                        <tr key={d.date} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                          <td className="px-4 py-2 text-text-primary">{new Date(d.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-right text-text-secondary">{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Top 10 Players */}
              <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <h3 className="text-sm font-semibold text-text-primary">Top 10 Players</h3>
                </div>
                {analytics.topPlayers.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-sm">No player data yet.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-2 text-text-secondary font-medium">#</th>
                        <th className="text-left px-4 py-2 text-text-secondary font-medium">Player</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">Total Score</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">Games</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topPlayers.map((p, i) => (
                        <tr key={p.playerName} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                          <td className="px-4 py-2 text-text-muted">{i + 1}</td>
                          <td className="px-4 py-2 text-text-primary font-medium">{p.playerName}</td>
                          <td className="px-4 py-2 text-right text-accent-400 font-bold">{p.totalScore}</td>
                          <td className="px-4 py-2 text-right text-text-secondary">{p.gamesPlayed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Per-Game Breakdown */}
              <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <h3 className="text-sm font-semibold text-text-primary">Per-Game Breakdown</h3>
                </div>
                {analytics.avgScoresByGame.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-sm">No game data yet.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-2 text-text-secondary font-medium">Game</th>
                        <th className="text-left px-4 py-2 text-text-secondary font-medium">Type</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">Avg Score</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.avgScoresByGame.map(g => (
                        <tr key={g.gameId} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                          <td className="px-4 py-2 text-text-primary font-medium">{g.game?.title ?? 'Unknown'}</td>
                          <td className="px-4 py-2"><TypeBadge type={g.game?.type ?? ''} /></td>
                          <td className="px-4 py-2 text-right">
                            <span className={scoreColor(g.avgScore)}>{Math.round(g.avgScore)}</span>
                          </td>
                          <td className="px-4 py-2 text-right text-text-secondary">{g.sessionsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">Failed to load analytics.</div>
          )}
        </>
      )}

      {/* Game Form Modal */}
      {showGameForm && (
        <GameForm
          initial={editingGame}
          onClose={() => { setShowGameForm(false); setEditingGame(undefined) }}
          onSaved={fetchGames}
        />
      )}

      {/* Submission Viewer Modal */}
      {viewingSubmission && (
        <SubmissionViewer
          submission={viewingSubmission}
          onClose={() => setViewingSubmission(null)}
        />
      )}
    </div>
  )
}

// ── Stat Card ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-bg-surface border border-white/8 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}
