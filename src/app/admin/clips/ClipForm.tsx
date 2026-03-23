'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const SKILL_OPTIONS = [
  { value: 'eye-contact', label: 'Eye Contact' },
  { value: 'open-posture', label: 'Open Posture' },
  { value: 'active-listening', label: 'Active Listening' },
  { value: 'vocal-pacing', label: 'Vocal Pacing' },
  { value: 'confident-disagreement', label: 'Confident Disagreement' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

interface ClipFormData {
  youtubeVideoId: string
  movieTitle: string
  characterName: string
  actorName: string
  year: string
  sceneDescription: string
  skillCategory: string
  difficulty: string
  difficultyScore: string
  signalClarity: string
  noiseLevel: string
  contextDependency: string
  replicationDifficulty: string
  annotation: string
  contextNote: string
  script: string
  screenplaySource: string
  startSec: string
  endSec: string
  isActive: boolean
}

const EMPTY: ClipFormData = {
  youtubeVideoId: '',
  movieTitle: '',
  characterName: '',
  actorName: '',
  year: '',
  sceneDescription: '',
  skillCategory: 'eye-contact',
  difficulty: 'beginner',
  difficultyScore: '8',
  signalClarity: '2',
  noiseLevel: '2',
  contextDependency: '2',
  replicationDifficulty: '2',
  annotation: '',
  contextNote: '',
  script: '',
  screenplaySource: '',
  startSec: '0',
  endSec: '30',
  isActive: true,
}

interface Props {
  initial?: Partial<ClipFormData & { id: string }>
  mode: 'new' | 'edit'
}

function inputClass() {
  return 'bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent-400/50 transition-colors w-full'
}

function labelClass() {
  return 'text-sm text-text-secondary font-medium'
}

export default function ClipForm({ initial, mode }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ClipFormData>({ ...EMPTY, ...(initial ?? {}) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof ClipFormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      youtubeVideoId: form.youtubeVideoId,
      movieTitle: form.movieTitle,
      characterName: form.characterName || null,
      actorName: form.actorName || null,
      year: form.year ? Number(form.year) : null,
      sceneDescription: form.sceneDescription,
      skillCategory: form.skillCategory,
      difficulty: form.difficulty,
      difficultyScore: Number(form.difficultyScore),
      signalClarity: Number(form.signalClarity),
      noiseLevel: Number(form.noiseLevel),
      contextDependency: Number(form.contextDependency),
      replicationDifficulty: Number(form.replicationDifficulty),
      annotation: form.annotation,
      contextNote: form.contextNote || null,
      script: form.script || null,
      screenplaySource: form.screenplaySource || null,
      startSec: Number(form.startSec),
      endSec: Number(form.endSec),
      isActive: form.isActive,
    }

    const url = mode === 'new' ? '/api/admin/clips' : `/api/admin/clips/${(initial as any).id}`
    const method = mode === 'new' ? 'POST' : 'PUT'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to save clip.')
      return
    }
    router.push('/admin/clips')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && (
        <div className="mb-4 bg-error/10 border border-error/30 rounded-xl px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      <div className="bg-bg-surface border border-white/8 rounded-2xl p-6 flex flex-col gap-5">
        {/* YouTube */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass()}>YouTube Video ID *</label>
          <input
            required
            value={form.youtubeVideoId}
            onChange={e => set('youtubeVideoId', e.target.value)}
            className={inputClass()}
            placeholder="e.g. dQw4w9WgXcQ"
          />
          {form.youtubeVideoId && (
            <img
              src={`https://img.youtube.com/vi/${form.youtubeVideoId}/hqdefault.jpg`}
              alt="Preview"
              className="mt-1 w-48 h-28 object-cover rounded-lg border border-white/8"
            />
          )}
        </div>

        {/* Movie info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>Movie Title *</label>
            <input required value={form.movieTitle} onChange={e => set('movieTitle', e.target.value)} className={inputClass()} placeholder="The Shawshank Redemption" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>Year</label>
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)} className={inputClass()} placeholder="1994" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>Character Name</label>
            <input value={form.characterName} onChange={e => set('characterName', e.target.value)} className={inputClass()} placeholder="Andy Dufresne" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>Actor Name</label>
            <input value={form.actorName} onChange={e => set('actorName', e.target.value)} className={inputClass()} placeholder="Tim Robbins" />
          </div>
        </div>

        {/* Scene */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass()}>Scene Description *</label>
          <textarea
            required
            rows={3}
            value={form.sceneDescription}
            onChange={e => set('sceneDescription', e.target.value)}
            className={`${inputClass()} resize-y`}
            placeholder="Describe the scene and what makes it a good example…"
          />
        </div>

        {/* Skill + difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>Skill Category *</label>
            <select value={form.skillCategory} onChange={e => set('skillCategory', e.target.value)} className={inputClass()}>
              {SKILL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>Difficulty *</label>
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={inputClass()}>
              {DIFFICULTY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>Start (seconds) *</label>
            <input type="number" required min={0} value={form.startSec} onChange={e => set('startSec', e.target.value)} className={inputClass()} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass()}>End (seconds) *</label>
            <input type="number" required min={1} value={form.endSec} onChange={e => set('endSec', e.target.value)} className={inputClass()} />
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          {([
            ['difficultyScore', 'Difficulty Score (4–12)', 4, 12],
            ['signalClarity', 'Signal Clarity (1–3)', 1, 3],
            ['noiseLevel', 'Noise Level (1–3)', 1, 3],
            ['contextDependency', 'Context Dependency (1–3)', 1, 3],
            ['replicationDifficulty', 'Replication Difficulty (1–3)', 1, 3],
          ] as const).map(([field, label, min, max]) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className={labelClass()}>{label}</label>
              <input type="number" min={min} max={max} value={form[field]} onChange={e => set(field, e.target.value)} className={inputClass()} />
            </div>
          ))}
        </div>

        {/* Annotation */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass()}>Annotation (coaching note) *</label>
          <textarea
            required
            rows={3}
            value={form.annotation}
            onChange={e => set('annotation', e.target.value)}
            className={`${inputClass()} resize-y`}
            placeholder="What learners should focus on and observe…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass()}>Context Note</label>
          <textarea
            rows={2}
            value={form.contextNote}
            onChange={e => set('contextNote', e.target.value)}
            className={`${inputClass()} resize-y`}
            placeholder="Optional background context for this scene…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass()}>Script / Dialogue</label>
          <textarea
            rows={3}
            value={form.script}
            onChange={e => set('script', e.target.value)}
            className={`${inputClass()} resize-y`}
            placeholder="The exact dialogue or action script the learner should perform…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass()}>Screenplay Source URL</label>
          <input
            type="url"
            className={inputClass()}
            placeholder="https://imsdb.com/scripts/..."
            value={form.screenplaySource}
            onChange={e => set('screenplaySource', e.target.value)}
          />
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => set('isActive', e.target.checked)}
            className="w-4 h-4 rounded accent-amber-400"
          />
          <span className="text-sm text-text-secondary">Active (visible in library)</span>
        </label>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : mode === 'new' ? 'Create Clip' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/clips')}
          className="px-5 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay border border-white/8 rounded-xl transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
