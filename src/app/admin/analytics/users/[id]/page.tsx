'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Activity } from 'lucide-react'

interface UserDetail {
  user: {
    id: string
    name: string | null
    email: string
    role: string
    createdAt: string
    onboardingComplete: boolean
  }
  events: { id: string; type: string; metadata: any; createdAt: string }[]
  sessions: { id: string; createdAt: string; status: string; scores: any; clip: { movieTitle: string; skillCategory: string } }[]
  arcadeAttempts: { id: string; score: number; createdAt: string; challenge: { title: string; type: string } }[]
  scoreHistory: { date: string; score: number; skill: string }[]
}

export default function UserAnalyticsPage() {
  const params = useParams()
  const userId = params.id as string
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/analytics/users/${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [userId])

  if (loading) return <div className="p-8 text-text-muted">Loading…</div>
  if (!data) return <div className="p-8 text-text-muted">User not found.</div>

  const maxScore = 100

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/admin/analytics" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Analytics
      </Link>

      {/* User header */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-400/20 flex items-center justify-center">
            <User size={20} className="text-accent-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{data.user.name || data.user.email}</h1>
            <div className="flex items-center gap-3 text-sm text-text-secondary mt-0.5">
              <span>{data.user.email}</span>
              <span className="capitalize px-2 py-0.5 rounded-md text-xs font-medium bg-bg-inset">{data.user.role}</span>
              <span>Joined {new Date(data.user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-surface border border-black/8 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{data.sessions.length}</p>
          <p className="text-xs text-text-secondary mt-1">Practice Sessions</p>
        </div>
        <div className="bg-bg-surface border border-black/8 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{data.arcadeAttempts.length}</p>
          <p className="text-xs text-text-secondary mt-1">Arcade Attempts</p>
        </div>
        <div className="bg-bg-surface border border-black/8 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{data.events.length}</p>
          <p className="text-xs text-text-secondary mt-1">Activity Events</p>
        </div>
        <div className="bg-bg-surface border border-black/8 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {data.scoreHistory.length > 0 ? Math.round(data.scoreHistory.reduce((a, b) => a + b.score, 0) / data.scoreHistory.length) : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-1">Avg Score</p>
        </div>
      </div>

      {/* Learning curve */}
      {data.scoreHistory.length > 0 && (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Learning Curve</h3>
          <div className="flex items-end gap-1 h-32">
            {data.scoreHistory.map((point, i) => (
              <div
                key={i}
                className="flex-1 bg-accent-400/60 hover:bg-accent-400 rounded-t transition-colors"
                style={{ height: `${(point.score / maxScore) * 100}%` }}
                title={`Score: ${point.score} — ${point.skill}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity timeline */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity size={14} />
            Activity Timeline
          </h3>
          {data.events.length === 0 ? (
            <p className="text-text-muted text-sm">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {data.events.map(event => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-accent-400 flex-shrink-0" />
                  <span className="text-text-primary capitalize flex-1">{event.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-text-tertiary">
                    {new Date(event.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Arcade attempts */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Arcade Attempts</h3>
          {data.arcadeAttempts.length === 0 ? (
            <p className="text-text-muted text-sm">No arcade attempts yet.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {data.arcadeAttempts.map(attempt => (
                <div key={attempt.id} className="flex items-center gap-3 text-sm">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    attempt.score >= 70 ? 'bg-success/10 text-success' :
                    attempt.score >= 40 ? 'bg-warning/10 text-warning' :
                    'bg-error/10 text-error'
                  }`}>
                    {attempt.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary truncate">{attempt.challenge.title}</p>
                    <p className="text-xs text-text-tertiary capitalize">{attempt.challenge.type}</p>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
