'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Play, ExternalLink,
  Sparkles, Send, AlertCircle, ChevronDown, ChevronUp, Film, Footprints,
} from 'lucide-react'

// ── Types (match the updated API response) ────────────────────────────

interface StepAsset {
  id: string
  stepNumber: number
  skillFocus: string
  status: string
  blobUrl: string | null
  error: string | null
  durationSec: number
}

interface MainVideo {
  id: string
  status: string
  blobUrl: string | null
  error: string | null
  durationSec: number
}

interface CollectionRequest {
  id: string
  collectionTitle: string
  sourcePracticeIdeaId: string | null
  status: string
  mainVideo: MainVideo | null
  steps: StepAsset[]
  totalAssets: number
  readyAssets: number
}

interface AssetProgress {
  ready: number
  generating: number
  failed: number
}

interface RequestProgress {
  draft: number
  generating: number
  review: number
  published: number
  failed: number
}

interface CollectionData {
  batchId: string
  batchName: string
  totalRequests: number
  totalAssets: number
  assetProgress: AssetProgress
  requestProgress: RequestProgress
  requests: CollectionRequest[]
}

// ── Status Badge ──────────────────────────────────────────────────────

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const styles: Record<string, string> = {
    draft: 'bg-blue-500/20 text-blue-400',
    generating: 'bg-amber-500/20 text-amber-400',
    review: 'bg-purple-500/20 text-purple-400',
    published: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
    ready: 'bg-emerald-500/20 text-emerald-400',
    complete: 'bg-emerald-500/20 text-emerald-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${small ? 'text-[10px]' : 'text-xs'} ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {status === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {status}
    </span>
  )
}

// ── Asset mini card ───────────────────────────────────────────────────

function AssetMiniCard({ label, status, blobUrl, error }: {
  label: string; status: string; blobUrl: string | null; error: string | null
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-bg-base border border-black/6 rounded-xl">
      <div className="w-16 h-10 rounded-lg bg-bg-inset flex items-center justify-center shrink-0 overflow-hidden">
        {status === 'ready' && blobUrl ? (
          <video src={blobUrl} className="w-full h-full object-cover" muted preload="metadata" />
        ) : status === 'generating' ? (
          <Loader2 size={14} className="text-amber-400 animate-spin" />
        ) : status === 'failed' ? (
          <XCircle size={14} className="text-red-400" />
        ) : (
          <Play size={14} className="text-text-tertiary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-primary truncate">{label}</p>
        {error && <p className="text-[10px] text-red-400 truncate">{error}</p>}
      </div>
      <StatusBadge status={status} small />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function CollectionDetailPage() {
  const { batchId } = useParams() as { batchId: string }

  const [data, setData] = useState<CollectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [doneBanner, setDoneBanner] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/collections/${batchId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load')
      }
      const result: CollectionData = await res.json()
      setData(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => { fetchCollection() }, [fetchCollection])

  // Auto-poll while assets are still generating
  useEffect(() => {
    if (!data) return
    const hasActive = data.assetProgress.generating > 0 || data.requestProgress.draft > 0
    if (!hasActive) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (data.totalAssets > 0 && !doneBanner) {
        setDoneBanner(`All done! ${data.assetProgress.ready} videos ready, ${data.assetProgress.failed} failed.`)
      }
      return
    }
    if (!pollRef.current) {
      pollRef.current = setInterval(async () => {
        const result = await fetchCollection()
        if (result && result.assetProgress.generating === 0 && result.requestProgress.draft === 0) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }
      }, 4000)
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [data, fetchCollection, doneBanner])

  async function handlePublishAll() {
    if (!data || !confirm('Publish all ready practices to the clip library? This creates Clip + PracticeSteps + Tags.')) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/collections/${batchId}/publish`, { method: 'POST' })
      const body = await res.json()
      if (res.ok) {
        setDoneBanner(`Published ${body.published} practices. ${body.failed > 0 ? `${body.failed} failed.` : ''}`)
        fetchCollection()
      } else {
        setError(body.error || 'Publish failed')
      }
    } catch {
      setError('Publish failed')
    }
    setPublishing(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if ((error && !data) || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/admin/toolkit/ai-generator" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back to AI Generator
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="font-semibold text-red-400">Failed to load collection</p>
            <p className="text-sm text-text-secondary mt-1">{error || 'Not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const reviewCount = data.requestProgress.review
  const assetPct = data.totalAssets > 0 ? Math.round(((data.assetProgress.ready + data.assetProgress.failed) / data.totalAssets) * 100) : 0

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/admin/toolkit/ai-generator" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3">
        <ArrowLeft size={12} /> Back to AI Generator
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{data.batchName}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {data.totalRequests} practices · {data.totalAssets} total videos (main + steps)
          </p>
        </div>
        <Link
          href={`/admin/toolkit/practice-ideating/${batchId}`}
          className="text-xs text-accent-400 hover:underline flex items-center gap-1"
        >
          <ExternalLink size={11} /> View Practice Ideas
        </Link>
      </div>

      {/* Done / error banners */}
      {doneBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-400">{doneBanner}</p>
        </div>
      )}
      {error && data && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 mb-6">{error}</div>
      )}

      {/* Asset-level progress bar */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-400">{data.assetProgress.ready} ready</span>
            {data.assetProgress.generating > 0 && <span className="text-amber-400">{data.assetProgress.generating} generating</span>}
            {data.assetProgress.failed > 0 && <span className="text-red-400">{data.assetProgress.failed} failed</span>}
          </div>
          <span className="text-xs text-text-muted">{assetPct}% · {data.totalAssets} videos</span>
        </div>
        <div className="w-full h-2 bg-bg-inset rounded-full overflow-hidden flex">
          {data.assetProgress.ready > 0 && (
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(data.assetProgress.ready / data.totalAssets) * 100}%` }} />
          )}
          {data.assetProgress.failed > 0 && (
            <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${(data.assetProgress.failed / data.totalAssets) * 100}%` }} />
          )}
          {data.assetProgress.generating > 0 && (
            <div className="h-full bg-amber-400 animate-pulse transition-all duration-500" style={{ width: `${(data.assetProgress.generating / data.totalAssets) * 100}%` }} />
          )}
        </div>
      </div>

      {/* Practice idea cards */}
      <div className="space-y-3 mb-8">
        {data.requests.map((req, i) => {
          const expanded = expandedId === req.id
          const mainReady = req.mainVideo?.status === 'ready'
          const stepsReady = req.steps.filter(s => s.status === 'ready').length
          const stepsTotal = req.steps.length

          return (
            <div key={req.id} className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(expanded ? null : req.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-bg-overlay transition-colors"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-accent-400/10 text-accent-400 text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{req.collectionTitle}</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-tertiary mt-0.5">
                    <span className="flex items-center gap-1">
                      <Film size={10} />
                      Main: <StatusBadge status={req.mainVideo?.status || 'draft'} small />
                    </span>
                    <span className="flex items-center gap-1">
                      <Footprints size={10} />
                      Steps: {stepsReady}/{stepsTotal} ready
                    </span>
                  </div>
                </div>
                <StatusBadge status={req.status} />
                {expanded ? <ChevronUp size={16} className="text-text-tertiary shrink-0" /> : <ChevronDown size={16} className="text-text-tertiary shrink-0" />}
              </button>

              {/* Expanded: main video + step videos */}
              {expanded && (
                <div className="border-t border-black/8 p-4 space-y-3">
                  {/* Main video */}
                  {req.mainVideo && (
                    <div>
                      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Film size={10} className="text-accent-400" /> Main Video (15s)
                      </p>
                      <div className="flex items-center gap-4 p-3 bg-bg-base border border-black/6 rounded-xl">
                        <div className="w-28 h-16 rounded-lg bg-bg-inset flex items-center justify-center shrink-0 overflow-hidden">
                          {req.mainVideo.status === 'ready' && req.mainVideo.blobUrl ? (
                            <video src={req.mainVideo.blobUrl} controls className="w-full h-full object-cover" muted preload="metadata" />
                          ) : req.mainVideo.status === 'generating' ? (
                            <Loader2 size={18} className="text-amber-400 animate-spin" />
                          ) : req.mainVideo.status === 'failed' ? (
                            <XCircle size={18} className="text-red-400" />
                          ) : (
                            <Play size={18} className="text-text-tertiary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text-primary font-medium">Main practice video</p>
                          {req.mainVideo.error && <p className="text-xs text-red-400 mt-0.5">{req.mainVideo.error}</p>}
                        </div>
                        <StatusBadge status={req.mainVideo.status} />
                      </div>
                    </div>
                  )}

                  {/* Step videos */}
                  {req.steps.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Footprints size={10} className="text-accent-400" /> Step Videos (5s each)
                      </p>
                      <div className="space-y-2">
                        {req.steps.map((step) => (
                          <AssetMiniCard
                            key={step.id}
                            label={`Step ${step.stepNumber}: ${step.skillFocus}`}
                            status={step.status}
                            blobUrl={step.blobUrl}
                            error={step.error}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View detail link */}
                  <Link
                    href={`/admin/toolkit/ai-generator/${req.id}`}
                    className="flex items-center gap-1 text-[11px] text-accent-400 hover:underline mt-2"
                  >
                    <ExternalLink size={11} /> Open in AI Generator detail
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Publish footer */}
      {reviewCount > 0 && (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {reviewCount} practice{reviewCount !== 1 ? 's' : ''} ready to publish
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Creates Clip + PracticeSteps + ObservationGuide + Tags for each.
            </p>
          </div>
          <button
            onClick={handlePublishAll}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {publishing ? <><Loader2 size={14} className="animate-spin" /> Publishing...</> : <><Send size={14} /> Publish All Ready</>}
          </button>
        </div>
      )}
    </div>
  )
}
