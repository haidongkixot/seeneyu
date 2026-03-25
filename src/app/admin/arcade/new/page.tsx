'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewBundlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    theme: '',
    difficulty: 'beginner',
    xpReward: 100,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/arcade/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const bundle = await res.json()
      router.push(`/admin/arcade/${bundle.id}`)
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create bundle')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/admin/arcade" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Arcade
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">New Bundle</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Theme</label>
          <input
            type="text"
            required
            placeholder="e.g. job-interview, dating, negotiation"
            value={form.theme}
            onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
            className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">XP Reward</label>
            <input
              type="number"
              min={0}
              value={form.xpReward}
              onChange={e => setForm(f => ({ ...f, xpReward: parseInt(e.target.value) || 0 }))}
              className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-accent-400 text-text-inverse rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 transition-all duration-150"
        >
          {saving ? 'Creating…' : 'Create Bundle'}
        </button>
      </form>
    </div>
  )
}
