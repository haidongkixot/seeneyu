'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Sparkles } from 'lucide-react'
import { KeywordsTagInput } from '@/components/admin/KeywordsTagInput'

const SKILL_OPTIONS = [
  { value: 'eye-contact', label: 'Eye Contact' },
  { value: 'open-posture', label: 'Open Posture' },
  { value: 'active-listening', label: 'Active Listening' },
  { value: 'vocal-pacing', label: 'Vocal Pacing' },
  { value: 'confident-disagreement', label: 'Confident Disagreement' },
  { value: 'special', label: 'Special Technique' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all', label: 'All' },
]

const inputCls = 'w-full bg-bg-inset border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/60 focus:ring-1 focus:ring-accent-400/20 transition-colors'
const labelCls = 'text-sm font-semibold text-text-primary mb-1.5 block'

export default function NewCrawlJobPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    skillCategory: 'eye-contact',
    technique: '',
    keywords: [] as string[],
    difficulty: 'all',
    maxResults: 20,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit(andRun: boolean) {
    if (!form.name.trim()) { setError('Job name is required'); return }
    if (form.keywords.length === 0) { setError('At least one keyword is required'); return }
    setSubmitting(true)
    setError(null)

    const skillCategory = form.skillCategory === 'special'
      ? (form.technique || 'special')
      : form.skillCategory

    try {
      const res = await fetch('/api/admin/crawl-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          skillCategory,
          technique: form.skillCategory === 'special' ? form.technique || null : null,
          keywords: form.keywords,
          difficulty: form.difficulty === 'all' ? null : form.difficulty,
          maxResults: form.maxResults,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create job')
      }
      const job = await res.json()

      if (andRun) {
        // Trigger run (fire-and-forget, navigate to detail page)
        fetch(`/api/admin/crawl-jobs/${job.id}/run`, { method: 'POST' })
      }
      router.push(`/admin/crawl-jobs/${job.id}`)
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/crawl-jobs" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-4">
          <ArrowLeft size={12} />
          All Jobs
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Create Crawl Job</h1>
        <p className="text-sm text-text-secondary mt-1">Configure a YouTube search + AI relevance scoring run.</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">
        {/* Job Name */}
        <div>
          <label className={labelCls}>Job Name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Power Pause examples — advanced vocal"
          />
        </div>

        {/* Skill Category */}
        <div>
          <label className={labelCls}>Skill Category</label>
          <select
            className={`${inputCls} cursor-pointer`}
            value={form.skillCategory}
            onChange={e => set('skillCategory', e.target.value)}
          >
            {SKILL_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Technique (conditional) */}
        {form.skillCategory === 'special' && (
          <div className="animate-fade-in">
            <label className={labelCls}>
              Technique / Tactic Name
              <Sparkles size={12} className="inline ml-1.5 text-accent-400" />
            </label>
            <input
              className={inputCls}
              value={form.technique}
              onChange={e => set('technique', e.target.value)}
              placeholder="e.g. Triangle Gaze, Power Pause, Strategic Whisper"
            />
            <p className="text-xs text-text-tertiary mt-1.5">Browse available tactics in the communication tactics taxonomy</p>
          </div>
        )}

        {/* Keywords */}
        <div>
          <label className={labelCls}>Search Keywords</label>
          <KeywordsTagInput
            value={form.keywords}
            onChange={v => set('keywords', v)}
            max={5}
            placeholder="Type a keyword and press Enter…"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className={labelCls}>Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => set('difficulty', d.value)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  form.difficulty === d.value
                    ? 'border-accent-400/60 bg-accent-400/10 text-accent-400'
                    : 'border-white/10 text-text-secondary hover:border-white/20'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Results */}
        <div>
          <label className={labelCls}>Max Results</label>
          <input
            type="number"
            min={1}
            max={50}
            className="w-20 bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-center text-text-primary focus:border-accent-400/60 outline-none"
            value={form.maxResults}
            onChange={e => set('maxResults', Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
          />
          <p className="text-xs text-text-tertiary mt-1">Max: 50. More results = more API cost.</p>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

        {/* Submit */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={submitting}
            className="border border-white/15 text-text-primary px-5 py-2.5 rounded-full text-sm font-medium hover:border-white/30 transition-colors disabled:opacity-50"
          >
            Create Job
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={submitting}
            className="bg-accent-400 text-bg-base px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-amber-300 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play size={13} />
            {submitting ? 'Creating…' : 'Create & Run →'}
          </button>
        </div>
      </div>
    </div>
  )
}
