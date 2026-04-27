'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Chrome, Copy, RefreshCw, Loader2, LogOut, ShieldCheck, History } from 'lucide-react'

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

  const sectionCls =
    'bg-bg-surface border border-bg-overlay rounded-xl p-5 mt-5'
  const h2Cls = 'text-base font-semibold text-text-primary m-0 mb-2'
  const pCls = 'text-text-secondary text-sm m-0 mb-3'
  const btnPrimaryCls =
    'inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-text-inverse border-0 px-4 py-2.5 rounded-md font-semibold cursor-pointer disabled:opacity-50'
  const btnGhostCls =
    'inline-flex items-center gap-1.5 bg-transparent text-text-secondary border border-bg-overlay hover:border-text-secondary px-3 py-2 rounded-md cursor-pointer text-sm'
  const btnDangerCls =
    'inline-flex items-center gap-1.5 bg-transparent text-error border border-error/40 hover:bg-error-dim px-3 py-2 rounded-md cursor-pointer text-sm'

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 text-text-primary">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 no-underline"
      >
        <ArrowLeft size={14} /> Settings
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 m-0">
        <Chrome size={24} className="text-accent-500" /> Mirror Mode Extension
      </h1>
      <p className="text-text-secondary mt-2 text-sm">
        Connect the Seeneyu browser extension to get private real-time body-language coaching during
        Zoom, Meet, and Teams calls. All analysis runs on your device.
      </p>

      {disabled && (
        <div className="mt-4 p-3 rounded-lg border border-warning/30 bg-warning-dim text-warning text-sm">
          The extension is currently disabled for your account. Please check back later.
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-error/30 bg-error-dim text-error text-sm">
          {error}
        </div>
      )}

      {/* ── Pairing ─────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={h2Cls}>1. Pair your extension</h2>
        <p className={pCls}>
          Generate a 6-digit code and paste it into the extension side panel. Codes expire after
          2 minutes.
        </p>

        {!code && (
          <button onClick={generateCode} disabled={generating || disabled} className={btnPrimaryCls}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Generate pairing code
          </button>
        )}

        {code && (
          <div className="flex flex-col gap-3">
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-5 text-center">
              <div className="text-xs text-text-tertiary tracking-widest uppercase">Pairing code</div>
              <div className="text-4xl font-bold tracking-[0.5rem] text-accent-600 my-2 font-mono">
                {code}
              </div>
              <div className="text-xs text-text-secondary">
                {secondsLeft > 0 ? `Expires in ${secondsLeft}s` : 'Expired — generate a new code'}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyCode} className={btnGhostCls}>
                <Copy size={14} /> Copy
              </button>
              <button onClick={generateCode} disabled={generating} className={btnGhostCls}>
                <RefreshCw size={14} /> New code
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Opt-in ──────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={h2Cls}>2. Post-call summary sync</h2>
        <p className={pCls}>
          After each coached session, the extension can send only an anonymous aggregate
          (duration + averages) to your Seeneyu account so your progress is saved. Raw video and
          audio never leave your device, regardless of this setting.
        </p>

        <label className="flex items-start gap-2.5 p-3 bg-bg-elevated border border-bg-overlay rounded-md cursor-pointer">
          <input
            type="checkbox"
            disabled={!prefs || savingPrefs || disabled}
            checked={!!prefs?.metricsOptIn}
            onChange={(e) => updateOptIn(e.target.checked)}
            className="mt-1"
          />
          <div>
            <div className="font-semibold text-text-primary">
              Save post-call summaries to my account
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              {prefs?.metricsOptInAt
                ? `Enabled on ${new Date(prefs.metricsOptInAt).toLocaleString()}`
                : 'Off by default — you can change this any time.'}
            </div>
          </div>
        </label>
      </section>

      {/* ── Privacy / Revoke ────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={h2Cls}>3. Connected extensions</h2>
        <p className={pCls}>
          Revoking signs out all paired browsers. You'll need to re-pair with a new code.
        </p>
        <button onClick={revokeAll} disabled={revoking || disabled} className={btnDangerCls}>
          {revoking ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          Revoke all connections
        </button>
        {revokedMsg && <div className="mt-2 text-sm text-success">{revokedMsg}</div>}
      </section>

      {/* ── History ──────────────────────────────────────────── */}
      <Link
        href="/settings/extension/sessions"
        className={`${sectionCls} flex items-center gap-3 no-underline text-text-primary hover:bg-bg-elevated transition-colors`}
      >
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-2.5 text-accent-600">
          <History size={20} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-text-primary">Practice history</div>
          <div className="text-xs text-text-secondary mt-0.5">
            Every Mirror Mode session with Coach Ney's full write-up.
          </div>
        </div>
      </Link>

      {/* ── Privacy summary ─────────────────────────────────────── */}
      <section className="mt-5 p-5 rounded-xl bg-success-dim border border-success/30">
        <h2 className="text-base font-semibold text-success m-0 mb-2 flex items-center gap-2">
          <ShieldCheck size={18} /> Privacy summary
        </h2>
        <ul className="m-0 pl-5 text-sm text-text-primary leading-relaxed">
          <li>Video and audio are processed <strong>locally on your device</strong>.</li>
          <li>No frames, no audio, no transcripts are ever uploaded.</li>
          <li>Access tokens expire after 15 minutes and auto-rotate.</li>
          <li>You can revoke the extension instantly from this page.</li>
        </ul>
      </section>
    </div>
  )
}
