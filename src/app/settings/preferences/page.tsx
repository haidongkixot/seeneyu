'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { GENRES, PURPOSES, TRAITS, GENDERS } from '@/lib/preference-constants'

interface LearningPrefs {
  goal: string | null
  genres: string[]
  purposes: string[]
  traits: string[]
  gender: string | null
}

export default function LearningPreferencesPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()

  const [prefs, setPrefs] = useState<LearningPrefs>({
    goal: null,
    genres: [],
    purposes: [],
    traits: [],
    gender: null,
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

    fetch('/api/preferences')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then((data: LearningPrefs) => {
        setPrefs(data)
      })
      .catch(() => {
        // Use defaults
      })
      .finally(() => setLoading(false))
  }, [authStatus, router])

  const toggleMulti = (key: 'genres' | 'purposes' | 'traits', value: string) => {
    setPrefs((prev) => {
      const arr = prev[key]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genres: prefs.genres,
          purposes: prefs.purposes,
          traits: prefs.traits,
          gender: prefs.gender,
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

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-text-primary">Learning Preferences</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Customize your learning curve
            </p>
          </div>
        </div>

        {/* Genres */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Genres</h2>
          <p className="text-xs text-text-tertiary mb-4">Pick the content styles you enjoy most</p>
          <div className="grid grid-cols-2 gap-3">
            {GENRES.map(({ value, label, description, icon }) => {
              const selected = prefs.genres.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleMulti('genres', value)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                    selected
                      ? 'border-accent-400/60 bg-accent-400/10'
                      : 'border-black/8 hover:border-black/15 hover:bg-bg-overlay'
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${selected ? 'text-accent-400' : 'text-text-primary'}`}>
                      {label}
                    </p>
                    {description && (
                      <p className="text-xs text-text-tertiary mt-0.5 leading-tight">{description}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Purpose */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Purpose</h2>
          <p className="text-xs text-text-tertiary mb-4">Why are you practicing body language?</p>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map(({ value, label, icon }) => {
              const selected = prefs.purposes.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleMulti('purposes', value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? 'border-accent-400/60 bg-accent-400/10 text-accent-400'
                      : 'border-black/8 text-text-secondary hover:border-black/15 hover:bg-bg-overlay'
                  }`}
                >
                  {icon && <span>{icon}</span>}
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Traits */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Traits</h2>
          <p className="text-xs text-text-tertiary mb-4">What communication styles do you want to develop?</p>
          <div className="flex flex-wrap gap-2">
            {TRAITS.map(({ value, label }) => {
              const selected = prefs.traits.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleMulti('traits', value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? 'border-accent-400/60 bg-accent-400/10 text-accent-400'
                      : 'border-black/8 text-text-secondary hover:border-black/15 hover:bg-bg-overlay'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Gender */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Gender</h2>
          <p className="text-xs text-text-tertiary mb-4">Helps us tailor clip recommendations (optional)</p>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map(({ value, label }) => {
              const selected = prefs.gender === value
              return (
                <button
                  key={value}
                  onClick={() => setPrefs((prev) => ({ ...prev, gender: selected ? null : value }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? 'border-accent-400/60 bg-accent-400/10 text-accent-400'
                      : 'border-black/8 text-text-secondary hover:border-black/15 hover:bg-bg-overlay'
                  }`}
                >
                  {label}
                </button>
              )
            })}
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

        {/* Other settings links */}
        <Link
          href="/settings/notifications"
          className="flex items-center gap-3 p-4 bg-bg-surface border border-black/8 rounded-2xl hover:border-black/15 transition-colors group"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Notification Preferences</p>
            <p className="text-xs text-text-tertiary">Channels, frequency, and schedule</p>
          </div>
          <ArrowLeft size={14} className="text-text-muted rotate-180 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Toast */}
        {saved && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-accent-400 text-text-inverse text-sm font-medium px-5 py-2.5 rounded-xl shadow-lg animate-fade-in-up z-50">
            Preferences saved successfully
          </div>
        )}
      </main>
    </div>
  )
}
