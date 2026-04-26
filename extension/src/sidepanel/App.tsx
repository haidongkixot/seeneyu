import { useEffect, useState } from 'react'
import type { MirrorMetricSample } from '@seeneyu/scoring'
import {
  authedFetch,
  clearTokens,
  issueTokens,
  loadTokens,
  revokeAll,
} from '../lib/auth-client'
import { send } from '../lib/messaging'
import type { CoachingNudge } from '../lib/coaching-rules'
import { Hud } from './components/Hud'
import { PairingScreen } from './components/PairingScreen'
import { OptInToggle } from './components/OptInToggle'
import { CoachingNudgeCard } from './components/CoachingNudgeCard'
import { SessionSummary, type CoachSummaryPayload } from './components/SessionSummary'

type Stage = 'loading' | 'paired' | 'unpaired'
type StatusKind = 'info' | 'warn' | 'error'
interface StatusMessage {
  message: string
  kind: StatusKind
  hint?: string
}

export function App() {
  const [stage, setStage] = useState<Stage>('loading')
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sample, setSample] = useState<MirrorMetricSample | null>(null)
  const [optIn, setOptIn] = useState(false)
  const [statusLine, setStatusLine] = useState<StatusMessage | null>(null)
  const [lastError, setLastError] = useState<string>('')
  const [nudge, setNudge] = useState<CoachingNudge | null>(null)
  const [summary, setSummary] = useState<CoachSummaryPayload | null>(null)

  useEffect(() => {
    loadTokens().then((t) => setStage(t ? 'paired' : 'unpaired'))
    const handler = (msg: any) => {
      if (msg?.type === 'mirror/sample') {
        setSample(msg.sample)
      } else if (msg?.type === 'mirror/nudge') {
        setNudge(msg.nudge as CoachingNudge)
      } else if (msg?.type === 'mirror/status') {
        setStatusLine((prev) => {
          if (prev?.kind === 'error' && msg.kind === 'info') return prev
          return {
            message: msg.message || prev?.message || '',
            kind: (msg.kind as StatusKind) || 'info',
            hint: msg.hint,
          }
        })
        if (msg.error) setLastError(msg.error)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  useEffect(() => {
    if (stage !== 'paired') return
    authedFetch('/api/extension/preferences', { method: 'GET' })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setOptIn(!!p?.metricsOptIn))
      .catch(() => {})
  }, [stage])

  async function pair(code: string) {
    await issueTokens(code)
    setStage('paired')
  }

  async function start() {
    setLastError('')
    setSummary(null)
    setStatusLine({ message: 'Requesting camera and microphone…', kind: 'info' })
    let testStream: MediaStream | null = null
    try {
      testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    } catch (err) {
      const name = (err as Error)?.name || ''
      const msg = (err as Error)?.message || 'permission request failed'
      if (name === 'NotAllowedError') {
        setStatusLine({
          message: 'Camera / microphone blocked.',
          kind: 'error',
          hint: 'Click the camera icon in the address bar and choose Allow, then try again.',
        })
      } else {
        setStatusLine({ message: `Permission failed: ${msg}`, kind: 'error' })
      }
      return
    } finally {
      testStream?.getTracks().forEach((t) => t.stop())
    }
    await send({ type: 'mirror/start' })
    setRunning(true)
  }

  async function stop() {
    setSubmitting(true)
    try {
      const res: any = await chrome.runtime.sendMessage({ type: 'mirror/stop' })
      setRunning(false)
      if (res?.summary) {
        setSummary(res.summary as CoachSummaryPayload)
      } else {
        setStatusLine({
          message: 'Session ended. No summary available — make sure post-call sync is on.',
          kind: 'warn',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function updateOptIn(next: boolean) {
    const res = await authedFetch('/api/extension/preferences', {
      method: 'PUT',
      body: JSON.stringify({ metricsOptIn: next }),
    })
    if (res.ok) setOptIn(next)
  }

  async function disconnect() {
    await revokeAll()
    await clearTokens()
    setStage('unpaired')
    setRunning(false)
    setSummary(null)
  }

  if (stage === 'loading') return <div style={{ padding: 16 }}>Loading…</div>
  if (stage === 'unpaired') return <PairingScreen onPair={pair} />

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 16, margin: 0 }}>Seeneyu Mirror</h1>
        <button onClick={disconnect} style={btnGhost}>Disconnect</button>
      </header>

      {summary ? (
        <SessionSummary data={summary} onDone={() => setSummary(null)} />
      ) : (
        <>
          <Hud sample={sample} running={running} />

          {nudge && running && (
            <CoachingNudgeCard nudge={nudge} onDismiss={() => setNudge(null)} />
          )}

          {statusLine && <StatusCard status={statusLine} lastError={lastError} />}

          <div>
            {running ? (
              <button onClick={stop} disabled={submitting} style={btnPrimary}>
                {submitting ? 'Coach Ney is reviewing…' : 'Stop & Get Feedback'}
              </button>
            ) : (
              <button onClick={start} style={btnPrimary}>Start Mirror</button>
            )}
          </div>

          <OptInToggle value={optIn} onChange={updateOptIn} />

          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 'auto' }}>
            All analysis runs locally on your device. Video and audio never leave this window.
          </p>
        </>
      )}

      <style>{`
        @keyframes mirror-pop {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function StatusCard({ status, lastError }: { status: StatusMessage; lastError: string }) {
  const palette =
    status.kind === 'error'
      ? { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.35)', fg: '#fca5a5' }
      : status.kind === 'warn'
        ? { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.3)', fg: '#facc15' }
        : { bg: 'transparent', border: 'transparent', fg: '#9ca3af' }

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        padding: palette.bg === 'transparent' ? 0 : 10,
        color: palette.fg,
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: status.kind === 'info' ? 400 : 600 }}>{status.message}</div>
      {status.hint && (
        <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 11, lineHeight: 1.6 }}>
          {status.hint}
        </div>
      )}
      {lastError && status.kind === 'error' && (
        <details style={{ marginTop: 6 }}>
          <summary style={{ cursor: 'pointer', fontSize: 10, color: '#6b7280' }}>
            Technical detail
          </summary>
          <pre
            style={{
              marginTop: 4,
              padding: 6,
              background: '#0f172a',
              color: '#94a3b8',
              fontSize: 10,
              borderRadius: 4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {lastError}
          </pre>
        </details>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  background: '#f59e0b', color: '#0d0d14', border: 0,
  padding: '10px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', width: '100%',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#9ca3af', border: '1px solid #374151',
  padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
}
