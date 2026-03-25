'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react'

interface Challenge {
  id: string
  type: string
  title: string
  description: string
  context: string
  referenceImageUrl: string | null
  difficulty: string
  xpReward: number
  orderIndex: number
}

interface Bundle {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  xpReward: number
  challenges: Challenge[]
}

export default function BundleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bundleId = params.bundleId as string

  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', theme: '', difficulty: '', xpReward: 0 })

  const fetchBundle = useCallback(async () => {
    const res = await fetch(`/api/admin/arcade/bundles/${bundleId}`)
    if (res.ok) {
      const data = await res.json()
      setBundle(data)
      setForm({ title: data.title, description: data.description, theme: data.theme, difficulty: data.difficulty, xpReward: data.xpReward })
    }
    setLoading(false)
  }, [bundleId])

  useEffect(() => { fetchBundle() }, [fetchBundle])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/arcade/bundles/${bundleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    fetchBundle()
  }

  async function handleDeleteChallenge(id: string) {
    if (!confirm('Delete this challenge?')) return
    await fetch(`/api/admin/arcade/challenges/${id}`, { method: 'DELETE' })
    fetchBundle()
  }

  async function handleReorder(id: string, newIndex: number) {
    await fetch(`/api/admin/arcade/challenges/${id}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIndex: newIndex }),
    })
    fetchBundle()
  }

  async function handleDeleteBundle() {
    if (!confirm('Delete this entire bundle and all challenges? This cannot be undone.')) return
    await fetch(`/api/admin/arcade/bundles/${bundleId}`, { method: 'DELETE' })
    router.push('/admin/arcade')
  }

  if (loading) return <div className="p-8 text-text-muted">Loading…</div>
  if (!bundle) return <div className="p-8 text-text-muted">Bundle not found.</div>

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/admin/arcade" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Arcade
      </Link>

      {/* Bundle header */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 mb-6">
        {editing ? (
          <div className="space-y-4">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-lg font-bold focus:outline-none focus:border-accent-400/50"
            />
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
            />
            <div className="grid grid-cols-3 gap-4">
              <input
                value={form.theme}
                onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                placeholder="Theme"
                className="bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
              />
              <select
                value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                className="bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                type="number"
                value={form.xpReward}
                onChange={e => setForm(f => ({ ...f, xpReward: parseInt(e.target.value) || 0 }))}
                className="bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-accent-400 text-text-inverse rounded-xl px-4 py-2 text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 transition-all">
                <Save size={14} />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{bundle.title}</h1>
                <p className="text-sm text-text-secondary mt-1">{bundle.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-text-tertiary">
                  <span className="capitalize">{bundle.theme}</span>
                  <span>•</span>
                  <span className="capitalize">{bundle.difficulty}</span>
                  <span>•</span>
                  <span>{bundle.xpReward} XP</span>
                  <span>•</span>
                  <span>{bundle.challenges.length} challenges</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={handleDeleteBundle} className="p-2 text-text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Challenges */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Challenges</h2>
        <Link
          href={`/admin/arcade/${bundleId}/challenges/new`}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
        >
          <Plus size={14} />
          Add Challenge
        </Link>
      </div>

      {bundle.challenges.length === 0 ? (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-12 text-center text-text-muted">
          No challenges yet. Add the first one!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bundle.challenges.map((ch, i) => (
            <div key={ch.id} className="flex items-center gap-3 bg-bg-surface border border-black/8 rounded-xl p-4 hover:bg-bg-overlay/30 transition-colors">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => i > 0 && handleReorder(ch.id, bundle.challenges[i - 1].orderIndex)}
                  disabled={i === 0}
                  className="p-0.5 text-text-tertiary hover:text-text-primary disabled:opacity-20 transition-colors"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => i < bundle.challenges.length - 1 && handleReorder(ch.id, bundle.challenges[i + 1].orderIndex)}
                  disabled={i === bundle.challenges.length - 1}
                  className="p-0.5 text-text-tertiary hover:text-text-primary disabled:opacity-20 transition-colors"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Order number */}
              <span className="w-6 h-6 rounded-full bg-bg-inset border border-black/10 flex items-center justify-center text-xs text-text-tertiary font-mono">
                {ch.orderIndex}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{ch.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                    ch.type === 'facial' ? 'bg-violet-500/15 text-violet-300' : 'bg-cyan-500/15 text-cyan-300'
                  }`}>
                    {ch.type}
                  </span>
                  <span className="text-xs text-text-tertiary capitalize">{ch.difficulty}</span>
                  <span className="text-xs text-accent-400">+{ch.xpReward} XP</span>
                </div>
              </div>

              {/* Actions */}
              <Link
                href={`/admin/arcade/${bundleId}/challenges/${ch.id}/edit`}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
              >
                <Pencil size={14} />
              </Link>
              <button
                onClick={() => handleDeleteChallenge(ch.id)}
                className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
