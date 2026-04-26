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
    <div style={{ maxWidth: 880, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
      <Link
        href="/settings/extension"
        style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Mirror Mode Settings
      </Link>
      <h1 style={{ fontSize: 26, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Chrome size={22} /> Mirror Mode Practice History
      </h1>
      <p style={{ color: '#9ca3af', marginTop: 8 }}>
        Every meeting you ran through the extension. Click into one to read Coach Ney's full
        write-up.
      </p>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#f87171' }}>
          {error}
        </div>
      )}

      {sessions === null && !error && (
        <div style={{ marginTop: 24, color: '#9ca3af' }}>Loading…</div>
      )}

      {sessions && sessions.length === 0 && (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: '#111827',
            border: '1px dashed #374151',
            borderRadius: 10,
            textAlign: 'center',
            color: '#9ca3af',
          }}
        >
          <p style={{ margin: 0, fontSize: 14 }}>No sessions yet.</p>
          <p style={{ marginTop: 6, fontSize: 12 }}>
            Open the Seeneyu Mirror extension in your next Zoom or Meet call and click <strong>Start Mirror</strong>.
          </p>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/extension/${s.id}`}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                padding: 14,
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {fmtDate(s.startedAt)} · {fmtDuration(s.durationSeconds)}
                  </span>
                  {s.xpAwarded > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
                      <Trophy size={12} /> +{s.xpAwarded} XP
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: '#f9fafb' }}>
                  {s.coachHeadline || 'Session saved'}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 12, color: '#cbd5e1' }}>
                  <Stat icon={Eye} label="Eye" value={fmtScore(s.avgEyeContactPct, '%')} />
                  <Stat icon={User} label="Posture" value={fmtScore(s.avgPostureScore, '/100')} />
                  <Stat icon={Mic} label="Pace" value={fmtScore(s.avgVocalPaceWpm, ' wpm')} />
                </div>
              </div>
              <ChevronRight size={18} color="#6b7280" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon size={12} color="#6b7280" /> <strong style={{ color: '#e5e7eb', fontWeight: 600 }}>{value}</strong> <span style={{ color: '#6b7280' }}>{label}</span>
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
