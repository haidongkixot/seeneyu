'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'

export default function EditChallengePage() {
  const params = useParams()
  const router = useRouter()
  const bundleId = params.bundleId as string
  const challengeId = params.challengeId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    type: 'facial',
    title: '',
    description: '',
    context: '',
    referenceImageUrl: '',
    difficulty: 'beginner',
    xpReward: 20,
    orderIndex: 1,
  })

  useEffect(() => {
    fetch(`/api/admin/arcade/challenges/${challengeId}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          type: data.type,
          title: data.title,
          description: data.description,
          context: data.context,
          referenceImageUrl: data.referenceImageUrl || '',
          difficulty: data.difficulty,
          xpReward: data.xpReward,
          orderIndex: data.orderIndex,
        })
        setLoading(false)
      })
  }, [challengeId])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/arcade/upload-image', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setForm(f => ({ ...f, referenceImageUrl: url }))
    } else {
      alert('Upload failed')
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/admin/arcade/challenges/${challengeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push(`/admin/arcade/${bundleId}`)
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to update challenge')
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading…</div>

  return (
    <div className="p-8 max-w-2xl">
      <Link href={`/admin/arcade/${bundleId}`} className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Bundle
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Edit Challenge</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
            >
              <option value="facial">Facial</option>
              <option value="gesture">Gesture</option>
            </select>
          </div>
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
        </div>

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
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Context</label>
          <textarea
            required
            rows={2}
            value={form.context}
            onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Reference Image</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Image URL or upload below"
              value={form.referenceImageUrl}
              onChange={e => setForm(f => ({ ...f, referenceImageUrl: e.target.value }))}
              className="flex-1 bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
            />
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 text-sm text-text-secondary cursor-pointer hover:border-black/20 hover:text-text-primary transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={14} />
              {uploading ? 'Uploading…' : 'Upload'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          {form.referenceImageUrl && (
            <img src={form.referenceImageUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Order Index</label>
            <input
              type="number"
              min={1}
              value={form.orderIndex}
              onChange={e => setForm(f => ({ ...f, orderIndex: parseInt(e.target.value) || 1 }))}
              className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-accent-400 text-text-inverse rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 transition-all duration-150"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
