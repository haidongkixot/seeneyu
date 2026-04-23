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
import { Hud } from './components/Hud'
import { PairingScreen } from './components/PairingScreen'
import { OptInToggle } from './components/OptInToggle'

type Stage = 'loading' | 'paired' | 'unpaired'

type StatusKind = 'info' | 'warn' | 'error' | 'degraded'
interface StatusMessage {
  message: string
  kind: StatusKind
  hint?: string
}

export function App() {
  const [stage, setStage] = useState<Stage>('loading')
  const [running, setRunning] = useState(false)
  const [sample, setSample] = useState<MirrorMetricSample | null>(null)
  const [optIn, setOptIn] = useState(false)
  const [statusLine, setStatusLine] = useState<StatusMessage | null>(null)
  const [lastError, setLastError] = useState<string>('')

  useEffect(() => {
    loadTokens().then((t) => setStage(t ? 'paired' : 'unpaired'))
    const handler = (msg: any) => {
      if (msg?.type === 'mirror/sample') {
        setSample(msg.sample)
      } else if (msg?.type === 'mirror/status') {
        // Don't let a running diagnostic overwrite a sticky degraded / error.
        setStatusLine((prev) => {
          if (prev?.kind === 'degraded' && msg.kind === 'info') return prev
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
    // MV3 requires the camera/mic prompt to come from a visible context —
    // the hidden offscreen document cannot show it. We briefly acquire the
    // stream here (prompt is displayed over the side panel), then stop it
    // immediately; the permission is now granted to the extension origin and
    // the offscreen document can acquire its own stream without prompting.
    setLastError('')
    setStatusLine({ message: 'Requesting camera and microphone…', kind: 'info' })
    let testStream: MediaStream | null = null
    try {
      testStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
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
    await send({ type: 'mirror/stop' })
    setRunning(false)
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
  }

  if (stage === 'loading') {
    return <div style={{ padding: 16 }}>Loading…</div>
  }
  if (stage === 'unpaired') {
    return <PairingScreen onPair={pair} />
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 16, margin: 0 }}>Seeneyu Mirror</h1>
        <button onClick={disconnect} style={btnGhost}>Disconnect</button>
      </header>

      <Hud sample={sample} running={running} />

      {statusLine && <StatusCard status={statusLine} lastError={lastError} />}

      <div>
        {running ? (
          <button onClick={stop} style={btnPrimary}>Stop</button>
        ) : (
          <button onClick={start} style={btnPrimary}>Start Mirror</button>
        )}
      </div>

      <OptInToggle value={optIn} onChange={updateOptIn} />

      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 'auto' }}>
        All analysis runs locally on your device. Video and audio never leave this window.
      </p>
    </div>
  )
}

function StatusCard({ status, lastError }: { status: StatusMessage; lastError: string }) {
  const palette =
    status.kind === 'error'
      ? { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.35)', fg: '#fca5a5' }
      : status.kind === 'degraded'
        ? { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)', fg: '#fbbf24' }
        : status.kind === 'warn'
          ? { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.3)', fg: '#facc15' }
          : { bg: 'transparent', border: 'transparent', fg: '#9ca3af' }

  async function copySettingsUrl() {
    try {
      await navigator.clipboard.writeText('chrome://settings/system')
    } catch {
      /* ignore */
    }
  }

  const mentionsSettings = !!status.hint?.includes('chrome://settings')

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
        <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 11 }}>
          {status.hint}
          {mentionsSettings && (
            <button
              onClick={copySettingsUrl}
              style={{
                marginLeft: 8,
                background: 'transparent',
                color: '#93c5fd',
                border: '1px solid #1e3a8a',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Copy URL
            </button>
          )}
        </div>
      )}
      {lastError && status.kind !== 'info' && (
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
  padding: '8px 14px', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#9ca3af', border: '1px solid #374151',
  padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
}
