'use client'

import { useState, useEffect } from 'react'
import { X, Clock, CheckCircle } from 'lucide-react'
import type { CrawlResult } from '@/lib/types'

interface ApproveModalProps {
  result: CrawlResult
  jobId: string
  onClose: () => void
  onApproved: (resultId: string, clipId: string) => void
}

const SKILL_OPTIONS = [
  { value: 'eye-contact', label: 'Eye Contact' },
  { value: 'open-posture', label: 'Open Posture' },
  { value: 'active-listening', label: 'Active Listening' },
  { value: 'vocal-pacing', label: 'Vocal Pacing' },
  { value: 'confident-disagreement', label: 'Confident Disagreement' },
]

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced']

export function ApproveModal({ result, jobId, onClose, onApproved }: ApproveModalProps) {
  const [form, setForm] = useState({
    movieTitle: result.title,
    year: '',
    characterName: '',
    actorName: '',
    startSec: '0',
    endSec: '60',
    sceneDescription: result.description.slice(0, 300),
    annotation: result.aiAnalysis ?? '',
    skillCategory: 'eye-contact',
    difficulty: 'intermediate',
    screenplaySource: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/crawl-jobs/${jobId}/results/${result.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            clipMetadata: {
              ...form,
              year: form.year ? parseInt(form.year) : null,
              startSec: parseInt(form.startSec) || 0,
              endSec: parseInt(form.endSec) || 60,
              difficultyScore: 2,
              signalClarity: 2,
              noiseLevel: 2,
              contextDependency: 2,
              replicationDifficulty: 2,
            },
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to approve')
      }
      const data = await res.json()
      setSuccess(true)
      setTimeout(() => {
        onApproved(result.id, data.clipId)
      }, 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full bg-bg-inset border border-black/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/60 focus:ring-1 focus:ring-accent-400/20 transition-colors'
  const labelCls = 'text-sm font-semibold text-text-primary mb-1.5 block'

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg-surface border border-black/10 rounded-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/8 flex items-start justify-between">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-text-primary">Approve Clip</h2>
            <p className="text-sm text-text-secondary mt-0.5">Fill in clip metadata before adding to library</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: embed + info */}
          <div className="p-5 flex flex-col gap-3">
            <div className="aspect-video bg-bg-inset rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${result.youtubeId}?autoplay=0&mute=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="text-sm font-medium text-text-primary">{result.title}</p>
            <p className="text-xs text-text-secondary">{result.channelName}{result.durationSec ? ` · ${Math.floor(result.durationSec / 60)}:${String(result.durationSec % 60).padStart(2, '0')}` : ''}</p>
            {result.aiAnalysis && (
              <div className="bg-bg-inset rounded-xl p-3 text-xs text-text-secondary italic leading-relaxed">
                {result.aiAnalysis}
              </div>
            )}
          </div>

          {/* Right: form */}
          <div className="p-5 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-black/8">
            <div>
              <label className={labelCls}>Movie / Show Title</label>
              <input className={inputCls} value={form.movieTitle} onChange={e => set('movieTitle', e.target.value)} placeholder="e.g. The Social Network" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Year</label>
                <input className={inputCls} type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2024" />
              </div>
              <div>
                <label className={labelCls}>Character Name</label>
                <input className={inputCls} value={form.characterName} onChange={e => set('characterName', e.target.value)} placeholder="e.g. Mark Zuckerberg" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Actor Name</label>
              <input className={inputCls} value={form.actorName} onChange={e => set('actorName', e.target.value)} placeholder="e.g. Jesse Eisenberg" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Second</label>
                <input className={inputCls} type="number" value={form.startSec} onChange={e => set('startSec', e.target.value)} min="0" />
              </div>
              <div>
                <label className={labelCls}>End Second</label>
                <input className={inputCls} type="number" value={form.endSec} onChange={e => set('endSec', e.target.value)} min="0" />
              </div>
            </div>
            <p className="text-xs text-text-tertiary flex items-center gap-1 -mt-3">
              <Clock size={11} /> Set the clip start and end times
            </p>

            <div>
              <label className={labelCls}>Scene Description</label>
              <textarea
                className={`${inputCls} min-h-[72px] resize-none`}
                value={form.sceneDescription}
                onChange={e => set('sceneDescription', e.target.value)}
                placeholder="Describe what happens in this scene..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Skill Category</label>
                <select className={`${inputCls} cursor-pointer`} value={form.skillCategory} onChange={e => set('skillCategory', e.target.value)}>
                  {SKILL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Difficulty</label>
                <select className={`${inputCls} cursor-pointer`} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                  {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Annotation (AI analysis note)</label>
              <textarea
                className={`${inputCls} min-h-[56px] resize-none`}
                value={form.annotation}
                onChange={e => set('annotation', e.target.value)}
                placeholder="Brief coaching note for learners..."
              />
            </div>

            {error && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

            {success ? (
              <div className="w-full bg-emerald-500/15 border border-emerald-400/20 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-emerald-400">
                <CheckCircle size={16} />
                Clip added to library. Observation guide generating…
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                aria-busy={submitting}
                className="w-full bg-accent-400 text-bg-base font-semibold py-3 rounded-xl text-sm hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? 'Creating clip…' : 'Create Clip & Generate Guide →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
