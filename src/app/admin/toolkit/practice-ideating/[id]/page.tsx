'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileJson, FileText, ChevronDown, ChevronUp, Loader2, AlertCircle, Copy, Check, Sparkles, X, ExternalLink } from 'lucide-react'

interface Moment {
  atSecond: number
  technique: string
  what: string
  why: string
}

interface PracticeStep {
  stepNumber: number
  skillFocus: string
  instruction: string
  tip: string
  targetDurationSec: number
  videoPrompt: string
  imagePrompt: string
}

interface Idea {
  id: string
  title: string
  skillCategory: string
  difficulty: string
  characterName: string
  characterDescription: string
  sceneDescription: string
  annotation: string
  filmingStyle: string
  mainVideo: { durationSec: number; prompt: string }
  observationGuide: { headline: string; moments: Moment[] }
  practiceSteps: PracticeStep[]
}

interface Batch {
  id: string
  name: string
  status: string
  count: number
  ideas: Idea[] | null
  error: string | null
  config: any
  createdAt: string
  updatedAt: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent-400 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Provider options (fallback) ──────────────────────────────────────

const FALLBACK_PROVIDERS = [
  { value: 'openai-sora', label: 'OpenAI Sora' },
  { value: 'kling-video', label: 'Kling Video' },
  { value: 'runway', label: 'Runway' },
  { value: 'luma', label: 'Luma' },
]

const CONCURRENCY_OPTIONS = [1, 3, 5]

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Push to Generator state
  const [showPushModal, setShowPushModal] = useState(false)
  const [pushProviders, setPushProviders] = useState<{ value: string; label: string }[]>(FALLBACK_PROVIDERS)
  const [pushProvider, setPushProvider] = useState(FALLBACK_PROVIDERS[0].value)
  const [pushConcurrency, setPushConcurrency] = useState(3)
  const [pushing, setPushing] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [pushedAt, setPushedAt] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/toolkit/practice-ideating/batches/${id}`)
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
        const data = await res.json()
        setBatch(data.batch)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Fetch providers when modal opens
  useEffect(() => {
    if (!showPushModal) return
    async function loadProviders() {
      try {
        const res = await fetch('/api/admin/toolkit/ai-generator/providers')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data
              .filter((p: any) => p.available)
              .map((p: any) => ({ value: p.id, label: p.name }))
            if (mapped.length > 0) {
              setPushProviders(mapped)
              setPushProvider(mapped[0].value)
            }
          }
        }
      } catch {
        // Use fallback providers
      }
    }
    loadProviders()
  }, [showPushModal])

  async function handlePushToGenerator() {
    if (!batch) return
    setPushing(true)
    setPushError(null)
    try {
      const res = await fetch('/api/admin/toolkit/ai-generator/push-from-ideating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          provider: pushProvider,
          model: null,
          options: { duration: 15, aspectRatio: '16:9' },
          concurrency: pushConcurrency,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to push to generator')
      }
      setPushedAt(new Date().toISOString())
      setShowPushModal(false)
      router.push(`/admin/toolkit/ai-generator/collections/${batch.id}`)
    } catch (err: any) {
      setPushError(err.message)
    } finally {
      setPushing(false)
    }
  }

  const ideas = batch?.ideas ?? []
  const skills: Record<string, number> = {}
  const difficulties: Record<string, number> = {}
  const styles: Record<string, number> = {}
  ideas.forEach((i) => {
    skills[i.skillCategory] = (skills[i.skillCategory] || 0) + 1
    difficulties[i.difficulty] = (difficulties[i.difficulty] || 0) + 1
    styles[i.filmingStyle] = (styles[i.filmingStyle] || 0) + 1
  })

  if (loading) {
    return (
      <div className="p-8 text-center text-text-tertiary">
        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
        Loading batch...
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/admin/toolkit/practice-ideating" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back to batches
        </Link>
        <div className="bg-error/10 border border-error/30 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-error shrink-0" />
          <div>
            <p className="font-semibold text-error">Failed to load batch</p>
            <p className="text-sm text-text-secondary mt-1">{error || 'Batch not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/admin/toolkit/practice-ideating" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4">
        <ArrowLeft size={14} />
        Back to batches
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{batch.name}</h1>
          <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
            <span className={`px-2 py-0.5 rounded-full ${
              batch.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400'
              : batch.status === 'generating' ? 'bg-amber-500/20 text-amber-400'
              : batch.status === 'failed' ? 'bg-red-500/20 text-red-400'
              : 'bg-bg-inset text-text-muted'
            }`}>
              {batch.status}
            </span>
            <span>{batch.count} ideas</span>
            <span>•</span>
            <span>{new Date(batch.createdAt).toLocaleString()}</span>
          </div>
        </div>
        {batch.status === 'complete' && (
          <div className="flex items-center gap-2">
            {pushedAt ? (
              <Link
                href={`/admin/toolkit/ai-generator/collections/${batch.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/15 transition-colors"
              >
                <ExternalLink size={14} />
                View Collection
              </Link>
            ) : (
              <button
                onClick={() => setShowPushModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-semibold hover:bg-purple-500/15 transition-colors"
              >
                <Sparkles size={14} />
                Push to Generator
              </button>
            )}
            <a
              href={`/api/admin/toolkit/practice-ideating/batches/${batch.id}/export?format=json`}
              download
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-400/10 border border-accent-400/30 text-accent-400 text-sm font-semibold hover:bg-accent-400/15 transition-colors"
            >
              <FileJson size={14} />
              Download JSON
            </a>
            <a
              href={`/api/admin/toolkit/practice-ideating/batches/${batch.id}/export?format=md`}
              download
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-400/10 border border-accent-400/30 text-accent-400 text-sm font-semibold hover:bg-accent-400/15 transition-colors"
            >
              <FileText size={14} />
              Download MD
            </a>
          </div>
        )}
      </div>

      {batch.status === 'failed' && batch.error && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-sm text-error mb-6">
          <p className="font-semibold mb-1">Generation failed</p>
          <p className="text-xs">{batch.error}</p>
        </div>
      )}

      {/* Summary cards */}
      {batch.status === 'complete' && ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="bg-bg-surface border border-black/8 rounded-xl p-4">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(skills).map(([skill, count]) => (
                <span key={skill} className="text-xs px-2 py-0.5 rounded-md bg-bg-inset text-text-secondary">
                  {skill}: {count}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-bg-surface border border-black/8 rounded-xl p-4">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">Difficulty</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(difficulties).map(([diff, count]) => (
                <span key={diff} className="text-xs px-2 py-0.5 rounded-md bg-bg-inset text-text-secondary capitalize">
                  {diff}: {count}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-bg-surface border border-black/8 rounded-xl p-4">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">Style</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(styles).map(([style, count]) => (
                <span key={style} className="text-xs px-2 py-0.5 rounded-md bg-bg-inset text-text-secondary">
                  {style}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ideas list */}
      <div className="space-y-3">
        {ideas.map((idea, i) => {
          const expanded = expandedId === idea.id
          return (
            <div key={idea.id} className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : idea.id)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-bg-overlay transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-accent-400/10 text-accent-400 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-text-primary font-semibold truncate">{idea.title}</p>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                      <span>{idea.skillCategory}</span>
                      <span>•</span>
                      <span className="capitalize">{idea.difficulty}</span>
                      <span>•</span>
                      <span>{idea.filmingStyle}</span>
                      <span>•</span>
                      <span>{idea.characterName}</span>
                    </div>
                  </div>
                </div>
                {expanded ? <ChevronUp size={18} className="text-text-tertiary shrink-0" /> : <ChevronDown size={18} className="text-text-tertiary shrink-0" />}
              </button>

              {expanded && (
                <div className="border-t border-black/8 p-5 space-y-5">
                  {/* Scene + annotation */}
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-1">Scene</p>
                    <p className="text-sm text-text-primary leading-relaxed">{idea.sceneDescription}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-1">Coaching note</p>
                    <p className="text-sm text-text-secondary leading-relaxed italic">{idea.annotation}</p>
                  </div>

                  {/* Main video prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest">Main Video ({idea.mainVideo.durationSec}s)</p>
                      <CopyButton text={idea.mainVideo.prompt} />
                    </div>
                    <div className="bg-bg-base border border-black/8 rounded-xl p-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                      {idea.mainVideo.prompt}
                    </div>
                  </div>

                  {/* Observation guide */}
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">
                      Observation Guide — {idea.observationGuide.headline}
                    </p>
                    <ul className="space-y-2">
                      {idea.observationGuide.moments.map((m, mi) => (
                        <li key={mi} className="text-sm text-text-secondary">
                          <span className="text-accent-400 font-semibold">{m.atSecond}s</span>{' '}
                          — <span className="italic">{m.technique}</span>: {m.what}{' '}
                          <span className="text-text-tertiary">({m.why})</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Practice steps */}
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">Practice Steps</p>
                    <div className="space-y-3">
                      {idea.practiceSteps.map((step) => (
                        <div key={step.stepNumber} className="bg-bg-base border border-black/8 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-accent-400/10 text-accent-400 text-xs font-bold shrink-0">
                              {step.stepNumber}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-text-primary">
                                {step.skillFocus} <span className="text-xs text-text-tertiary font-normal">({step.targetDurationSec}s)</span>
                              </p>
                              <p className="text-sm text-text-secondary leading-relaxed mt-1">{step.instruction}</p>
                              <p className="text-xs text-accent-400 mt-2">💡 {step.tip}</p>
                              <div className="mt-3 space-y-2">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-semibold text-text-tertiary uppercase">Video prompt (5s)</p>
                                    <CopyButton text={step.videoPrompt} />
                                  </div>
                                  <p className="text-xs text-text-secondary bg-bg-surface border border-black/6 rounded-lg p-2">{step.videoPrompt}</p>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-semibold text-text-tertiary uppercase">Image prompt</p>
                                    <CopyButton text={step.imagePrompt} />
                                  </div>
                                  <p className="text-xs text-text-secondary bg-bg-surface border border-black/6 rounded-lg p-2">{step.imagePrompt}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Push to Generator Modal */}
      {showPushModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPushModal(false)}>
          <div
            className="bg-bg-surface border border-black/8 rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h2 className="text-lg font-bold text-text-primary">Push to AI Generator</h2>
              </div>
              <button
                onClick={() => setShowPushModal(false)}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-5">
              Generate video clips for all {batch?.count || 0} practice ideas in this batch.
            </p>

            <div className="space-y-4">
              {/* Provider */}
              <div>
                <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Provider
                </label>
                <select
                  value={pushProvider}
                  onChange={(e) => setPushProvider(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {pushProviders.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Duration (locked) */}
              <div>
                <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <div className="bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-muted">
                  15 seconds (fixed)
                </div>
              </div>

              {/* Aspect Ratio (display only) */}
              <div>
                <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Aspect Ratio
                </label>
                <div className="bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-muted">
                  16:9
                </div>
              </div>

              {/* Concurrency */}
              <div>
                <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Concurrency
                </label>
                <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
                  {CONCURRENCY_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPushConcurrency(c)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        pushConcurrency === c
                          ? 'bg-bg-surface text-text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {c} at a time
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Push error */}
            {pushError && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                {pushError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPushModal(false)}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePushToGenerator}
                disabled={pushing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                {pushing ? (
                  <><Loader2 size={14} className="animate-spin" /> Pushing...</>
                ) : (
                  <><Sparkles size={14} /> Confirm &amp; Push</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
