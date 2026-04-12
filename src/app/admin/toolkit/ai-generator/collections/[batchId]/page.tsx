'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Play, ExternalLink,
  Sparkles, Send, AlertCircle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface CollectionRequest {
  id: string
  collectionTitle: string
  status: string
  assetUrl: string | null
  error: string | null
}

interface CollectionProgress {
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
  progress: CollectionProgress
  requests: CollectionRequest[]
}

// ── Status Badge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-blue-500/20 text-blue-400',
    generating: 'bg-amber-500/20 text-amber-400',
    review: 'bg-purple-500/20 text-purple-400',
    published: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
    complete: 'bg-emerald-500/20 text-emerald-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {status === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {status}
    </span>
  )
}

// ── Collection Status Badge (batch-level) ────────────────────────────

function CollectionStatusBadge({ progress }: { progress: CollectionProgress }) {
  const total = progress.draft + progress.generating + progress.review + progress.published + progress.failed
  if (total === 0) return <StatusBadge status="draft" />
  if (progress.generating > 0 || progress.draft > 0) return <StatusBadge status="generating" />
  if (progress.failed === total) return <StatusBadge status="failed" />
  return <StatusBadge status="complete" />
}

// ── Progress Bar ─────────────────────────────────────────────────────

function ProgressBar({ progress, total }: { progress: CollectionProgress; total: number }) {
  if (total === 0) return null

  const ready = progress.review + progress.published
  const pct = total > 0 ? Math.round(((ready + progress.failed) / total) * 100) : 0

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-xs">
          {progress.review > 0 && (
            <span className="text-purple-400">{progress.review} ready for review</span>
          )}
          {progress.published > 0 && (
            <span className="text-emerald-400">{progress.published} published</span>
          )}
          {progress.failed > 0 && (
            <span className="text-red-400">{progress.failed} failed</span>
          )}
          {progress.generating > 0 && (
            <span className="text-amber-400">{progress.generating} generating</span>
          )}
          {progress.draft > 0 && (
            <span className="text-blue-400">{progress.draft} draft</span>
          )}
        </div>
        <span className="text-xs text-text-muted font-medium">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-bg-inset rounded-full overflow-hidden flex">
        {progress.published > 0 && (
          <div
            className="h-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${(progress.published / total) * 100}%` }}
          />
        )}
        {progress.review > 0 && (
          <div
            className="h-full bg-purple-400 transition-all duration-500"
            style={{ width: `${(progress.review / total) * 100}%` }}
          />
        )}
        {progress.failed > 0 && (
          <div
            className="h-full bg-red-400 transition-all duration-500"
            style={{ width: `${(progress.failed / total) * 100}%` }}
          />
        )}
        {progress.generating > 0 && (
          <div
            className="h-full bg-amber-400 animate-pulse transition-all duration-500"
            style={{ width: `${(progress.generating / total) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function CollectionDetailPage() {
  const { batchId } = useParams() as { batchId: string }
  const router = useRouter()

  const [data, setData] = useState<CollectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [doneBanner, setDoneBanner] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/collections/${batchId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load collection')
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

  // Initial fetch
  useEffect(() => {
    fetchCollection()
  }, [fetchCollection])

  // Auto-polling every 4 seconds
  useEffect(() => {
    if (!data) return

    const { progress } = data
    const hasActive = progress.draft > 0 || progress.generating > 0

    if (!hasActive) {
      // All in terminal state — stop polling, show banner
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      const ready = progress.review + progress.published
      if (data.totalRequests > 0 && !doneBanner) {
        setDoneBanner(`All done! ${ready} ready, ${progress.failed} failed.`)
      }
      return
    }

    // Start polling if not already
    if (!pollRef.current) {
      pollRef.current = setInterval(async () => {
        const result = await fetchCollection()
        if (result) {
          const still = result.progress.draft + result.progress.generating
          if (still === 0 && pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      }, 4000)
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [data, fetchCollection, doneBanner])

  async function handlePublishAll() {
    if (!data || !confirm('Publish all ready items to the clip library?')) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/collections/${batchId}/publish-all`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchCollection()
      } else {
        const body = await res.json().catch(() => ({}))
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

  if (error && !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/admin/toolkit/ai-generator" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back to AI Generator
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="font-semibold text-red-400">Failed to load collection</p>
            <p className="text-sm text-text-secondary mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const readyCount = data.progress.review
  const hasReadyItems = readyCount > 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/toolkit/ai-generator" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3">
          <ArrowLeft size={12} /> Back to AI Generator
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{data.batchName}</h1>
              <CollectionStatusBadge progress={data.progress} />
            </div>
            <p className="text-text-secondary text-sm mt-1">
              {data.totalRequests} items · Collection from Practice Ideating
            </p>
          </div>
        </div>
      </div>

      {/* Done banner */}
      {doneBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-400">{doneBanner}</p>
        </div>
      )}

      {/* Error banner */}
      {error && data && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Progress */}
      <ProgressBar progress={data.progress} total={data.totalRequests} />

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.requests.map((req) => (
          <div key={req.id} className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
            {/* Asset preview */}
            <div className="aspect-video bg-bg-inset relative flex items-center justify-center">
              {req.status === 'generating' ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-amber-400" />
                  <span className="text-[10px] text-text-muted">Generating...</span>
                </div>
              ) : req.status === 'draft' ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles size={24} className="text-blue-400" />
                  <span className="text-[10px] text-text-muted">Queued</span>
                </div>
              ) : req.status === 'failed' ? (
                <div className="flex flex-col items-center gap-2 px-4">
                  <XCircle size={24} className="text-red-400" />
                  <span className="text-[10px] text-red-400 text-center">{req.error || 'Failed'}</span>
                </div>
              ) : req.assetUrl ? (
                req.assetUrl.endsWith('.mp4') || req.assetUrl.includes('video') ? (
                  <video
                    src={req.assetUrl}
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={req.assetUrl}
                    alt={req.collectionTitle}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Play size={24} className="text-text-muted" />
                  <span className="text-[10px] text-text-muted">No asset</span>
                </div>
              )}

              {/* Status badge overlay */}
              <div className="absolute top-2 right-2">
                <StatusBadge status={req.status} />
              </div>
            </div>

            {/* Card body */}
            <div className="p-4">
              <p className="text-sm font-medium text-text-primary truncate mb-2">
                {req.collectionTitle}
              </p>
              <Link
                href={`/admin/toolkit/ai-generator/${req.id}`}
                className="flex items-center gap-1 text-[11px] text-accent-400 hover:bg-accent-400/10 rounded-lg px-2 py-1 -ml-2 transition-colors"
              >
                <ExternalLink size={11} /> View Detail
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer: Publish All Ready button */}
      {hasReadyItems && (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {readyCount} item{readyCount !== 1 ? 's' : ''} ready for publishing
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Publish all reviewed items to the clip library at once.
            </p>
          </div>
          <button
            onClick={handlePublishAll}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {publishing ? (
              <><Loader2 size={14} className="animate-spin" /> Publishing...</>
            ) : (
              <><Send size={14} /> Publish All Ready</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
