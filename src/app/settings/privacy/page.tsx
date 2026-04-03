'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Shield, Save, Loader2, CheckCircle2,
  Database, Trash2, Eye,
} from 'lucide-react'

interface ConsentState {
  storageAgreed: boolean
  updatedAt: string | null
  version: number
}

export default function PrivacySettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [storageAgreed, setStorageAgreed] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status !== 'authenticated') return

    fetch('/api/preferences/consent')
      .then((r) => r.json())
      .then((data: ConsentState) => {
        setConsent(data)
        setStorageAgreed(data.storageAgreed)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, router])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/preferences/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageAgreed }),
      })
      if (res.ok) {
        const data = await res.json()
        setConsent(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const hasChanges = consent && storageAgreed !== consent.storageAgreed

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/settings/notifications" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-4">
          <ArrowLeft size={12} /> Settings
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent-400/10 flex items-center justify-center">
            <Shield size={20} className="text-accent-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Privacy & Data</h1>
            <p className="text-sm text-text-secondary">Control how your practice data is stored and used</p>
          </div>
        </div>

        {/* Data Storage Consent */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Database size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-text-primary mb-1">Recording Data Storage</h2>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                When you practice, seeneyu records video to analyze your body language and provide feedback.
                You can choose whether these recordings are kept after your feedback is generated.
              </p>

              {/* Toggle */}
              <button
                onClick={() => setStorageAgreed(!storageAgreed)}
                className="flex items-center gap-3 w-full text-left group"
              >
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  storageAgreed ? 'bg-emerald-500' : 'bg-black/20'
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    storageAgreed ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`} />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {storageAgreed ? 'Recordings stored for skill tracking' : 'Recordings deleted after feedback'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* What happens with each choice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className={`bg-bg-surface border rounded-2xl p-5 transition-all ${
            storageAgreed ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-black/8'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} className="text-emerald-400" />
              <h3 className="text-xs font-semibold text-text-primary">When storage is ON</h3>
            </div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">+</span> Track your skill development over time</li>
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">+</span> Review past practice sessions</li>
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">+</span> Help improve seeneyu's coaching quality</li>
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">+</span> Personalized feedback based on your history</li>
            </ul>
          </div>

          <div className={`bg-bg-surface border rounded-2xl p-5 transition-all ${
            !storageAgreed ? 'border-amber-400/30 bg-amber-500/5' : 'border-black/8'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={14} className="text-amber-400" />
              <h3 className="text-xs font-semibold text-text-primary">When storage is OFF</h3>
            </div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex gap-2"><span className="text-text-tertiary mt-0.5">-</span> Recordings deleted right after feedback</li>
              <li className="flex gap-2"><span className="text-text-tertiary mt-0.5">-</span> Scores and feedback text still kept</li>
              <li className="flex gap-2"><span className="text-text-tertiary mt-0.5">-</span> Can't replay past recordings</li>
              <li className="flex gap-2"><span className="text-text-tertiary mt-0.5">-</span> Existing recordings will be deleted</li>
            </ul>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-accent-400 text-bg-base rounded-xl hover:bg-accent-300 transition-colors disabled:opacity-40"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle2 size={14} /> Saved</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </button>
          {consent?.updatedAt && (
            <span className="text-[10px] text-text-muted">
              Last updated: {new Date(consent.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Fine print */}
        <div className="mt-8 pt-6 border-t border-black/[0.04]">
          <p className="text-[10px] text-text-muted leading-relaxed">
            seeneyu processes your recordings on-device using MediaPipe for body language analysis.
            Video data is only uploaded for feedback generation and storage (if enabled).
            Your scores and coaching feedback are always retained regardless of this setting.
            You can change this preference at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
