'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Chrome, Clock, Trophy,
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
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href="/settings/extension/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 no-underline"
        >
          <ArrowLeft size={14} /> All sessions
        </Link>
        <div className="rounded-lg border border-error/30 bg-error-dim p-4 text-error">{error}</div>
      </div>
    )
  }
  if (!session) {
    return <div className="max-w-2xl mx-auto px-6 py-8 text-text-secondary">Loading…</div>
  }

  const mins = Math.floor(session.durationSeconds / 60)
  const secs = session.durationSeconds % 60

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 text-text-primary">
      <Link
        href="/settings/extension/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 no-underline"
      >
        <ArrowLeft size={14} /> All sessions
      </Link>

      <div className="text-xs uppercase tracking-wider text-text-tertiary inline-flex items-center gap-2">
        <Chrome size={12} /> Mirror Mode session · {fmtDate(session.startedAt)}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold leading-tight mt-1.5 mb-1 text-text-primary">
        {session.coachHeadline || 'Session saved'}
      </h1>
      <div className="text-sm text-text-secondary inline-flex items-center gap-3.5">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {mins}m {secs}s
        </span>
        {session.xpAwarded > 0 && (
          <span className="inline-flex items-center gap-1 text-accent-600 font-medium">
            <Trophy size={12} /> +{session.xpAwarded} XP
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <Dial label="Eye contact" value={session.avgEyeContactPct} suffix="%" />
        <Dial label="Posture" value={session.avgPostureScore} suffix="/100" />
        <Dial label="Pace" value={session.avgVocalPaceWpm} suffix=" wpm" />
      </div>

      {session.coachSummary && (
        <Section title="Coach Ney">
          <p className="text-base leading-relaxed text-text-primary m-0">
            {session.coachSummary}
          </p>
        </Section>
      )}

      {session.coachWhatWorked && session.coachWhatWorked.length > 0 && (
        <BulletSection
          title="What worked"
          items={session.coachWhatWorked}
          accentClass="text-success"
          Icon={CheckCircle2}
        />
      )}
      {session.coachWhatToImprove && session.coachWhatToImprove.length > 0 && (
        <BulletSection
          title="What to improve"
          items={session.coachWhatToImprove}
          accentClass="text-warning"
          Icon={AlertTriangle}
        />
      )}
      {session.coachNextSteps && session.coachNextSteps.length > 0 && (
        <BulletSection
          title="Next time, try"
          items={session.coachNextSteps}
          accentClass="text-info"
          Icon={Compass}
        />
      )}

      {session.timeSeries && session.timeSeries.length > 0 && (
        <Section title="Timeline">
          <Sparkline data={session.timeSeries} field="eyeContact" label="Eye contact %" color="#f59e0b" />
          <Sparkline data={session.timeSeries} field="posture" label="Posture" color="#22c55e" />
          <Sparkline data={session.timeSeries} field="pace" label="Pace (wpm)" color="#3b82f6" />
        </Section>
      )}

      {session.nudgesShown && session.nudgesShown.length > 0 && (
        <Section title="Live coaching during the session">
          <ul className="m-0 p-0 list-none">
            {session.nudgesShown.map((n, i) => (
              <li
                key={i}
                className="flex gap-3 py-2 text-sm text-text-primary border-b border-bg-overlay last:border-b-0"
              >
                <span className="text-text-tertiary min-w-14 font-mono">{fmtSeconds(n.at)}</span>
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
    <div className="bg-bg-surface border border-bg-overlay rounded-xl p-4 text-center">
      <div className="text-xs text-text-tertiary mb-1">{label}</div>
      <div className="text-2xl font-bold text-accent-600">
        {value === null ? '—' : Math.round(value)}
        <span className="text-xs text-text-tertiary font-normal">{suffix}</span>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-xs text-text-tertiary tracking-wider uppercase mb-2.5 font-medium">
        {title}
      </h2>
      {children}
    </section>
  )
}

function BulletSection({
  title,
  items,
  accentClass,
  Icon,
}: {
  title: string
  items: string[]
  accentClass: string
  Icon: any
}) {
  return (
    <Section title={title}>
      <ul className="m-0 p-0 list-none">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 py-2 border-b border-bg-overlay last:border-b-0">
            <Icon size={16} className={`${accentClass} flex-none mt-0.5`} />
            <span className="text-sm text-text-primary leading-relaxed">{it}</span>
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
    <div className="mb-3">
      <div className="text-xs text-text-tertiary flex justify-between">
        <span>{label}</span>
        <span>min {Math.round(min)} · max {Math.round(max)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block mt-1" style={{ height: H }}>
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
