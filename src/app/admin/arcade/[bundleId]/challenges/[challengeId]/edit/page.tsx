'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Sparkles, Loader2, Trash2, CheckCircle } from 'lucide-react'

export default function EditChallengePage() {
  const params = useParams()
  const router = useRouter()
  const bundleId = params.bundleId as string
  const challengeId = params.challengeId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [guidanceSteps, setGuidanceSteps] = useState<any[]>([])
  const [generatingGuidance, setGeneratingGuidance] = useState(false)
  const [form, setForm] = useState({
    type: 'facial',
    title: '',
    description: '',
    context: '',
    referenceImageUrl: '',
    mediaUrl: '',
    mediaType: '',
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
          mediaUrl: data.mediaUrl || '',
          mediaType: data.mediaType || '',
          difficulty: data.difficulty,
          xpReward: data.xpReward,
          orderIndex: data.orderIndex,
        })
        setGuidanceSteps(data.guidanceSteps ?? [])
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
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Media Type</label>
            <select
              value={form.mediaType}
              onChange={e => setForm(f => ({ ...f, mediaType: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
            >
              <option value="">None</option>
              <option value="ai_image">AI Image</option>
              <option value="ai_video">AI Video</option>
            </select>
          </div>
          {(form.mediaType === 'ai_image' || form.mediaType === 'ai_video') && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Media URL</label>
              <input
                type="url"
                value={form.mediaUrl}
                onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))}
                placeholder="https://example.com/image.png"
                className="w-full bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-400/50"
              />
            </div>
          )}
        </div>
        {form.mediaType === 'ai_image' && form.mediaUrl && (
          <img src={form.mediaUrl} alt="AI media preview" className="h-24 rounded-lg object-cover" />
        )}

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

      {/* Guidance Steps */}
      <div className="mt-8 bg-bg-surface border border-black/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Guidance Steps</h3>
          <button
            onClick={async () => {
              setGeneratingGuidance(true)
              try {
                const res = await fetch(`/api/admin/arcade/challenges/${challengeId}/guidance`, { method: 'POST' })
                if (res.ok) {
                  const data = await res.json()
                  setGuidanceSteps(data.steps ?? [])
                }
              } catch { /* ignore */ }
              setGeneratingGuidance(false)
            }}
            disabled={generatingGuidance}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-500/15 text-purple-400 rounded-lg hover:bg-purple-500/25 disabled:opacity-40 transition-colors"
          >
            {generatingGuidance ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {guidanceSteps.length > 0 ? 'Regenerate' : 'Generate Guidance'}
          </button>
        </div>

        {guidanceSteps.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No guidance steps yet. Click Generate to create them with AI.</p>
        ) : (
          <div className="space-y-3">
            {guidanceSteps.map((gs: any, i: number) => (
              <div key={i} className="bg-bg-overlay border border-black/[0.04] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">Step {gs.stepNumber}</span>
                  <button
                    onClick={() => {
                      const next = guidanceSteps.filter((_: any, j: number) => j !== i).map((s: any, j: number) => ({ ...s, stepNumber: j + 1 }))
                      setGuidanceSteps(next)
                    }}
                    className="text-text-muted hover:text-red-400"
                  ><Trash2 size={10} /></button>
                </div>
                <textarea
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-xs text-text-primary resize-none min-h-[48px]"
                  value={gs.instruction}
                  onChange={(e) => {
                    const next = [...guidanceSteps]
                    next[i] = { ...next[i], instruction: e.target.value }
                    setGuidanceSteps(next)
                  }}
                />
                <input
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-xs text-text-primary"
                  value={gs.tip ?? ''}
                  onChange={(e) => {
                    const next = [...guidanceSteps]
                    next[i] = { ...next[i], tip: e.target.value || null }
                    setGuidanceSteps(next)
                  }}
                  placeholder="Tip (optional)"
                />
              </div>
            ))}
            <button
              onClick={async () => {
                const res = await fetch(`/api/admin/arcade/challenges/${challengeId}/guidance`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ steps: guidanceSteps }),
                })
                if (res.ok) alert('Guidance saved!')
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors"
            >
              <CheckCircle size={12} /> Save Guidance Steps
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
