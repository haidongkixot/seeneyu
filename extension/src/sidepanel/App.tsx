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

export function App() {
  const [stage, setStage] = useState<Stage>('loading')
  const [running, setRunning] = useState(false)
  const [sample, setSample] = useState<MirrorMetricSample | null>(null)
  const [optIn, setOptIn] = useState(false)
  const [statusLine, setStatusLine] = useState<string>('')
  const [errorLine, setErrorLine] = useState<string>('')

  useEffect(() => {
    loadTokens().then((t) => setStage(t ? 'paired' : 'unpaired'))
    const handler = (msg: any) => {
      if (msg?.type === 'mirror/sample') {
        setSample(msg.sample)
        if (msg.sample) setStatusLine('Running')
      } else if (msg?.type === 'mirror/status') {
        if (msg.message) setStatusLine(msg.message)
        setErrorLine(msg.error || '')
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

      {running && (statusLine || errorLine) && (
        <div style={{ fontSize: 11, color: errorLine ? '#f87171' : '#9ca3af' }}>
          {errorLine || statusLine}
        </div>
      )}

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

const btnPrimary: React.CSSProperties = {
  background: '#f59e0b', color: '#0d0d14', border: 0,
  padding: '8px 14px', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#9ca3af', border: '1px solid #374151',
  padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
}
