'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Chrome, Clock, Eye, User, Mic, Trophy, ChevronRight } from 'lucide-react'

interface SessionRow {
  id: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  avgEyeContactPct: number | null
  avgPostureScore: number | null
  avgVocalPaceWpm: number | null
  coachHeadline: string | null
  coachGeneratedAt: string | null
  xpAwarded: number
}

export default function ExtensionSessionsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status !== 'authenticated') return
    fetch('/api/extension/sessions')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setSessions(data.sessions))
      .catch((e) => setError(String(e?.message || e)))
  }, [status, router])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 text-text-primary">
      <Link
        href="/settings/extension"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 no-underline"
      >
        <ArrowLeft size={14} /> Mirror Mode Settings
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 m-0">
        <Chrome size={22} className="text-accent-500" /> Mirror Mode Practice History
      </h1>
      <p className="text-text-secondary mt-2 text-sm">
        Every meeting you ran through the extension. Click into one to read Coach Ney's full write-up.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-error/30 bg-error-dim text-error text-sm">
          {error}
        </div>
      )}

      {sessions === null && !error && (
        <div className="mt-6 text-text-secondary">Loading…</div>
      )}

      {sessions && sessions.length === 0 && (
        <div className="mt-6 p-6 bg-bg-surface border border-dashed border-bg-overlay rounded-xl text-center">
          <p className="m-0 text-sm text-text-primary">No sessions yet.</p>
          <p className="mt-2 text-xs text-text-secondary">
            Open the Seeneyu Mirror extension in your next Zoom or Meet call and click <strong>Start Mirror</strong>.
          </p>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/extension/${s.id}`}
              className="flex gap-4 items-center p-4 bg-bg-surface border border-bg-overlay rounded-xl no-underline text-text-primary hover:bg-bg-elevated hover:border-accent-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text-tertiary flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> {fmtDate(s.startedAt)} · {fmtDuration(s.durationSeconds)}
                  </span>
                  {s.xpAwarded > 0 && (
                    <span className="inline-flex items-center gap-1 text-accent-600">
                      <Trophy size={12} /> +{s.xpAwarded} XP
                    </span>
                  )}
                </div>
                <div className="text-base font-semibold mt-1 text-text-primary">
                  {s.coachHeadline || 'Session saved'}
                </div>
                <div className="mt-2 flex gap-3.5 text-xs text-text-secondary">
                  <Stat icon={Eye} label="Eye" value={fmtScore(s.avgEyeContactPct, '%')} />
                  <Stat icon={User} label="Posture" value={fmtScore(s.avgPostureScore, '/100')} />
                  <Stat icon={Mic} label="Pace" value={fmtScore(s.avgVocalPaceWpm, ' wpm')} />
                </div>
              </div>
              <ChevronRight size={18} className="text-text-tertiary" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon size={12} className="text-text-tertiary" />
      <strong className="text-text-primary font-semibold">{value}</strong>
      <span className="text-text-tertiary">{label}</span>
    </span>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function fmtScore(v: number | null, suffix: string): string {
  if (v === null || v === undefined) return '—'
  return `${Math.round(v)}${suffix}`
}
