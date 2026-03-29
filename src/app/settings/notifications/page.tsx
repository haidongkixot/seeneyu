'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Smartphone,
  Mail,
  MessageCircle,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  Globe,
} from 'lucide-react'
import WhatsAppOptIn from '@/components/WhatsAppOptIn'

interface NotificationPreferences {
  inApp: boolean
  push: boolean
  email: boolean
  whatsapp: boolean
  frequency: 'quiet' | 'normal' | 'engaged'
  timezone: string
  optimalPracticeTime: string | null
  whatsappPhone?: string | null
  whatsappOptIn?: boolean
}

const frequencyOptions = [
  { value: 'quiet', label: 'Quiet', description: '1 notification/day' },
  { value: 'normal', label: 'Normal', description: '3 notifications/day' },
  { value: 'engaged', label: 'Engaged', description: '5 notifications/day' },
] as const

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export default function NotificationPreferencesPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    inApp: true,
    push: false,
    email: true,
    whatsapp: false,
    frequency: 'normal',
    timezone: detectTimezone(),
    optimalPracticeTime: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (authStatus !== 'authenticated') return

    fetch('/api/preferences/notifications')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then((data: NotificationPreferences) => {
        setPrefs({
          ...data,
          timezone: data.timezone || detectTimezone(),
        })
      })
      .catch(() => {
        // Use defaults
      })
      .finally(() => setLoading(false))
  }, [authStatus, router])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/preferences/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inApp: prefs.inApp,
          push: prefs.push,
          email: prefs.email,
          whatsapp: prefs.whatsapp,
          frequency: prefs.frequency,
          timezone: prefs.timezone,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPrefs((prev) => ({ ...prev, ...updated }))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleChannel = (key: 'inApp' | 'push' | 'email' | 'whatsapp') => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

  const channels = [
    { key: 'inApp' as const, label: 'In-App', icon: Bell, description: 'Notifications inside the app' },
    { key: 'push' as const, label: 'Push', icon: Smartphone, description: 'Browser & mobile push notifications' },
    { key: 'email' as const, label: 'Email', icon: Mail, description: 'Email digests and reminders' },
    { key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, description: 'WhatsApp coaching messages' },
  ]

  return (
    <div className="min-h-screen bg-bg-base pb-24 md:pb-10">
      <main className="max-w-2xl mx-auto px-4 lg:px-8 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-overlay transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notification Preferences</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Choose how and when Coach Ney reaches out to you.
            </p>
          </div>
        </div>

        {/* Channels */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Channels</h2>
          <div className="space-y-3">
            {channels.map(({ key, label, icon: Icon, description }) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-overlay transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-400/10 text-accent-400">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-xs text-text-tertiary">{description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleChannel(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    prefs[key] ? 'bg-accent-400' : 'bg-bg-overlay'
                  }`}
                  role="switch"
                  aria-checked={prefs[key]}
                  aria-label={`Toggle ${label} notifications`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      prefs[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Opt-In */}
        <WhatsAppOptIn
          initialPhone={prefs.whatsappPhone}
          initialOptIn={prefs.whatsappOptIn}
        />

        {/* Frequency */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Notification Frequency</h2>
          <div className="grid grid-cols-3 gap-2">
            {frequencyOptions.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setPrefs((prev) => ({ ...prev, frequency: value }))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  prefs.frequency === value
                    ? 'border-accent-400 bg-accent-400/8 shadow-glow-sm'
                    : 'border-black/8 hover:border-black/15 hover:bg-bg-overlay'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    prefs.frequency === value ? 'text-accent-600' : 'text-text-primary'
                  }`}
                >
                  {label}
                </p>
                <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Timezone & Schedule</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                <Globe size={12} /> Timezone
              </label>
              <select
                value={prefs.timezone}
                onChange={(e) => setPrefs((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-bg-base border border-black/8 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40 appearance-none"
              >
                {[
                  'UTC',
                  'America/New_York',
                  'America/Chicago',
                  'America/Denver',
                  'America/Los_Angeles',
                  'Europe/London',
                  'Europe/Paris',
                  'Europe/Berlin',
                  'Asia/Tokyo',
                  'Asia/Shanghai',
                  'Asia/Ho_Chi_Minh',
                  'Asia/Singapore',
                  'Australia/Sydney',
                  'Pacific/Auckland',
                ].map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Optimal practice time (read-only, computed) */}
            {prefs.optimalPracticeTime && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                  <Clock size={12} /> Optimal Practice Time
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-overlay border border-black/8 rounded-xl">
                  <span className="text-sm text-text-primary font-medium">
                    {prefs.optimalPracticeTime}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    (based on your activity patterns)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-400 text-text-inverse text-sm font-semibold rounded-xl hover:bg-accent-500 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </main>
    </div>
  )
}
