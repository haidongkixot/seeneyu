'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Chrome, Copy, RefreshCw, Loader2, LogOut, ShieldCheck } from 'lucide-react'

interface Preferences {
  metricsOptIn: boolean
  metricsOptInAt: string | null
}

export default function ExtensionSettingsPage() {
  const { status } = useSession()
  const router = useRouter()

  const [code, setCode] = useState<string | null>(null)
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [revokedMsg, setRevokedMsg] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status !== 'authenticated') return
    fetch('/api/extension/preferences')
      .then(async (r) => {
        if (r.status === 503) {
          setDisabled(true)
          return null
        }
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((data: Preferences | null) => { if (data) setPrefs(data) })
      .catch((e) => setError(String(e?.message || e)))
  }, [status, router])

  useEffect(() => {
    if (!codeExpiresAt) return
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((codeExpiresAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [codeExpiresAt])

  async function generateCode() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/extension/pair', { method: 'POST' })
      if (res.status === 503) { setDisabled(true); return }
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = (await res.json()) as { code: string; expiresInSec: number }
      setCode(data.code)
      setCodeExpiresAt(Date.now() + data.expiresInSec * 1000)
      setSecondsLeft(data.expiresInSec)
    } catch (e) {
      setError(String((e as Error)?.message || e))
    } finally {
      setGenerating(false)
    }
  }

  async function updateOptIn(next: boolean) {
    setSavingPrefs(true)
    try {
      const res = await fetch('/api/extension/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricsOptIn: next }),
      })
      if (res.ok) setPrefs((await res.json()) as Preferences)
    } finally {
      setSavingPrefs(false)
    }
  }

  async function revokeAll() {
    setRevoking(true)
    setRevokedMsg(null)
    try {
      const res = await fetch('/api/extension/token/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const { revokedCount } = (await res.json()) as { revokedCount: number }
        setRevokedMsg(`Revoked ${revokedCount} connection${revokedCount === 1 ? '' : 's'}.`)
      }
    } finally {
      setRevoking(false)
    }
  }

  async function copyCode() {
    if (!code) return
    await navigator.clipboard.writeText(code).catch(() => {})
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
      <Link
        href="/settings"
        style={{
          color: '#9ca3af', textDecoration: 'none', fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
        }}
      >
        <ArrowLeft size={14} /> Settings
      </Link>

      <h1 style={{ fontSize: 28, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Chrome size={26} /> Mirror Mode Extension
      </h1>
      <p style={{ color: '#9ca3af', marginTop: 8 }}>
        Connect the Seeneyu browser extension to get private real-time body-language coaching during
        Zoom, Meet, and Teams calls. All analysis runs on your device.
      </p>

      {disabled && (
        <div style={warnBox}>
          The extension is currently disabled for your account. Please check back later.
        </div>
      )}

      {error && <div style={errBox}>{error}</div>}

      {/* ── Pairing ─────────────────────────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>1. Pair your extension</h2>
        <p style={p}>
          Generate a 6-digit code and paste it into the extension side panel. Codes expire after
          2 minutes.
        </p>

        {!code && (
          <button
            onClick={generateCode}
            disabled={generating || disabled}
            style={btnPrimary}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Generate pairing code
          </button>
        )}

        {code && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                background: '#0f172a', border: '1px solid #1f2937', borderRadius: 8,
                padding: 20, textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
                Pairing code
              </div>
              <div
                style={{
                  fontSize: 42, fontWeight: 700, letterSpacing: 8, color: '#f59e0b',
                  margin: '8px 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {code}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                {secondsLeft > 0 ? `Expires in ${secondsLeft}s` : 'Expired — generate a new code'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyCode} style={btnGhost}>
                <Copy size={14} /> Copy
              </button>
              <button onClick={generateCode} disabled={generating} style={btnGhost}>
                <RefreshCw size={14} /> New code
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Opt-in ──────────────────────────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>2. Post-call summary sync</h2>
        <p style={p}>
          After each coached session, the extension can send only an anonymous aggregate
          (duration + averages) to your Seeneyu account so your progress is saved. Raw video and
          audio never leave your device, regardless of this setting.
        </p>

        <label style={toggleRow}>
          <input
            type="checkbox"
            disabled={!prefs || savingPrefs || disabled}
            checked={!!prefs?.metricsOptIn}
            onChange={(e) => updateOptIn(e.target.checked)}
          />
          <div>
            <div style={{ fontWeight: 600 }}>Save post-call summaries to my account</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {prefs?.metricsOptInAt
                ? `Enabled on ${new Date(prefs.metricsOptInAt).toLocaleString()}`
                : 'Off by default — you can change this any time.'}
            </div>
          </div>
        </label>
      </section>

      {/* ── Privacy / Revoke ────────────────────────────────────── */}
      <section style={section}>
        <h2 style={h2}>3. Connected extensions</h2>
        <p style={p}>
          Revoking signs out all paired browsers. You'll need to re-pair with a new code.
        </p>
        <button onClick={revokeAll} disabled={revoking || disabled} style={btnDanger}>
          {revoking ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          Revoke all connections
        </button>
        {revokedMsg && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#34d399' }}>{revokedMsg}</div>
        )}
      </section>

      {/* ── Privacy summary ─────────────────────────────────────── */}
      <section
        style={{
          ...section,
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.3)',
        }}
      >
        <h2 style={{ ...h2, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} /> Privacy summary
        </h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#cbd5e1', lineHeight: 1.8 }}>
          <li>Video and audio are processed <strong>locally on your device</strong>.</li>
          <li>No frames, no audio, no transcripts are ever uploaded.</li>
          <li>Access tokens expire after 15 minutes and auto-rotate.</li>
          <li>You can revoke the extension instantly from this page.</li>
        </ul>
      </section>
    </div>
  )
}

const section: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 10,
  padding: 20,
  marginTop: 20,
}
const h2: React.CSSProperties = { fontSize: 16, margin: '0 0 8px 0' }
const p: React.CSSProperties = { color: '#9ca3af', fontSize: 13, margin: '0 0 12px 0' }
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: '#f59e0b', color: '#0d0d14', border: 0,
  padding: '10px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', color: '#9ca3af', border: '1px solid #374151',
  padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
}
const btnDanger: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', color: '#f87171', border: '1px solid #7f1d1d',
  padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
}
const toggleRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  padding: 12, background: '#0f172a',
  border: '1px solid #1f2937', borderRadius: 6, cursor: 'pointer',
}
const warnBox: React.CSSProperties = {
  marginTop: 16, padding: 12, background: 'rgba(245,158,11,0.1)',
  border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: 13, color: '#fbbf24',
}
const errBox: React.CSSProperties = {
  marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 13, color: '#f87171',
}
