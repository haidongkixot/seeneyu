'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Chrome, Clock, Eye, User, Mic, Trophy,
  CheckCircle2, AlertTriangle, Compass,
} from 'lucide-react'

interface SessionDetail {
  id: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  avgEyeContactPct: number | null
  avgPostureScore: number | null
  avgVocalPaceWpm: number | null
  sampleCount: number
  clientVersion: string
  timeSeries: Array<{
    t: number
    eyeContact: number | null
    posture: number | null
    pace: number | null
  }> | null
  nudgesShown: Array<{ at: number; pattern: string; headline: string }> | null
  coachHeadline: string | null
  coachSummary: string | null
  coachWhatWorked: string[] | null
  coachWhatToImprove: string[] | null
  coachNextSteps: string[] | null
  coachGeneratedAt: string | null
  xpAwarded: number
}

export default function ExtensionSessionDetailPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = String(params?.id || '')
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status !== 'authenticated' || !id) return
    fetch(`/api/extension/sessions/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => setSession(data.session))
      .catch((e) => setError(String(e?.message || e)))
  }, [status, id, router])

  if (error) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, color: '#f87171' }}>
        <Link href="/settings/extension/sessions" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <ArrowLeft size={14} /> All sessions
        </Link>
        <div>{error}</div>
      </div>
    )
  }
  if (!session) {
    return <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, color: '#9ca3af' }}>Loading…</div>
  }

  const mins = Math.floor(session.durationSeconds / 60)
  const secs = session.durationSeconds % 60

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
      <Link
        href="/settings/extension/sessions"
        style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> All sessions
      </Link>

      <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Chrome size={12} /> Mirror Mode session · {fmtDate(session.startedAt)}
      </div>
      <h1 style={{ fontSize: 30, margin: '6px 0 4px 0', lineHeight: 1.2 }}>
        {session.coachHeadline || 'Session saved'}
      </h1>
      <div style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> {mins}m {secs}s
        </span>
        {session.xpAwarded > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
            <Trophy size={12} /> +{session.xpAwarded} XP
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
        <Dial label="Eye contact" value={session.avgEyeContactPct} suffix="%" />
        <Dial label="Posture" value={session.avgPostureScore} suffix="/100" />
        <Dial label="Pace" value={session.avgVocalPaceWpm} suffix=" wpm" />
      </div>

      {session.coachSummary && (
        <Section title="Coach Ney">
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#cbd5e1', margin: 0 }}>
            {session.coachSummary}
          </p>
        </Section>
      )}

      {session.coachWhatWorked && session.coachWhatWorked.length > 0 && (
        <BulletSection
          title="What worked"
          items={session.coachWhatWorked}
          accent="#34d399"
          Icon={CheckCircle2}
        />
      )}
      {session.coachWhatToImprove && session.coachWhatToImprove.length > 0 && (
        <BulletSection
          title="What to improve"
          items={session.coachWhatToImprove}
          accent="#fbbf24"
          Icon={AlertTriangle}
        />
      )}
      {session.coachNextSteps && session.coachNextSteps.length > 0 && (
        <BulletSection
          title="Next time, try"
          items={session.coachNextSteps}
          accent="#a5b4fc"
          Icon={Compass}
        />
      )}

      {session.timeSeries && session.timeSeries.length > 0 && (
        <Section title="Timeline">
          <Sparkline data={session.timeSeries} field="eyeContact" label="Eye contact %" color="#f59e0b" />
          <Sparkline data={session.timeSeries} field="posture" label="Posture" color="#34d399" />
          <Sparkline data={session.timeSeries} field="pace" label="Pace (wpm)" color="#a5b4fc" />
        </Section>
      )}

      {session.nudgesShown && session.nudgesShown.length > 0 && (
        <Section title="Live coaching during the session">
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {session.nudgesShown.map((n, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid #1f2937',
                  fontSize: 13,
                  color: '#cbd5e1',
                }}
              >
                <span style={{ color: '#6b7280', minWidth: 56 }}>{fmtSeconds(n.at)}</span>
                <span>{n.headline}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Dial({ label, value, suffix }: { label: string; value: number | null; suffix: string }) {
  return (
    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>
        {value === null ? '—' : Math.round(value)}
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>{suffix}</span>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 13, color: '#9ca3af', letterSpacing: 0.6, textTransform: 'uppercase', margin: '0 0 10px 0' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function BulletSection({
  title,
  items,
  accent,
  Icon,
}: {
  title: string
  items: string[]
  accent: string
  Icon: any
}) {
  return (
    <Section title={title}>
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #1f2937' }}>
            <Icon size={16} color={accent} style={{ flex: 'none', marginTop: 2 }} />
            <span style={{ fontSize: 14, color: '#e5e7eb', lineHeight: 1.55 }}>{it}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Sparkline({
  data,
  field,
  label,
  color,
}: {
  data: SessionDetail['timeSeries']
  field: 'eyeContact' | 'posture' | 'pace'
  label: string
  color: string
}) {
  if (!data || data.length === 0) return null
  const points = data.map((p) => p[field]).map((v) => (v === null ? null : Number(v)))
  const valid = points.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  const min = Math.min(...valid)
  const max = Math.max(...valid, min + 1)
  const W = 600
  const H = 60
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1 || 1)) * W
      if (v === null) return null
      const y = H - ((v - min) / (max - min)) * (H - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .filter(Boolean)
    .join(' ')
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span>min {Math.round(min)} · max {Math.round(max)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block', marginTop: 4 }}>
        <polyline fill="none" stroke={color} strokeWidth={1.5} points={path} />
      </svg>
    </div>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function fmtSeconds(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
