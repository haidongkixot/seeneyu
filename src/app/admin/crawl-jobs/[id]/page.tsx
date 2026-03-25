'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Play, CheckCircle, XCircle, Quote, RefreshCw } from 'lucide-react'
import type { CrawlJob, CrawlResult } from '@/lib/types'
import { ApproveModal } from '@/components/admin/ApproveModal'

// ── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; animated?: boolean }> = {
    pending:  { label: '○ PENDING',   cls: 'bg-black/5 text-text-secondary border-black/10' },
    running:  { label: '⟳ RUNNING…',  cls: 'bg-amber-500/10 text-amber-400 border-amber-400/20', animated: true },
    complete: { label: '● COMPLETE',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' },
    failed:   { label: '✗ FAILED',    cls: 'bg-red-500/10 text-red-400 border-red-400/20' },
  }
  const c = cfg[status] ?? cfg.pending
  return (
    <span aria-label={`Status: ${status}`} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.cls} ${c.animated ? 'animate-pulse' : ''}`}>
      {c.label}
    </span>
  )
}

// ── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 7
    ? 'bg-emerald-500/90 text-white'
    : score >= 4
    ? 'bg-amber-500/90 text-white'
    : 'bg-red-500/80 text-white'
  const dot = score >= 7 ? '●' : score >= 4 ? '◐' : '○'
  return (
    <span aria-label={`Relevance score: ${score} out of 10`} className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm ${cls}`}>
      {dot} {score.toFixed(1)}
    </span>
  )
}

// ── Result card ──────────────────────────────────────────────────────────────

interface ResultCardProps {
  result: CrawlResult
  optimisticStatus: string | null
  onApprove: (result: CrawlResult) => void
  onReject: (resultId: string) => void
  onUndo: (resultId: string) => void
}

function ResultCard({ result, optimisticStatus, onApprove, onReject, onUndo }: ResultCardProps) {
  const status = optimisticStatus ?? result.status

  const containerCls = status === 'approved'
    ? 'border-emerald-400/25 bg-emerald-500/5'
    : status === 'rejected'
    ? 'border-black/[0.04] opacity-50'
    : 'border-black/8'

  const durationStr = result.durationSec
    ? `${Math.floor(result.durationSec / 60)}:${String(result.durationSec % 60).padStart(2, '0')}`
    : null

  const viewStr = result.viewCount
    ? result.viewCount >= 1_000_000
      ? `${(result.viewCount / 1_000_000).toFixed(1)}M views`
      : result.viewCount >= 1_000
      ? `${(result.viewCount / 1_000).toFixed(0)}K views`
      : `${result.viewCount} views`
    : null

  return (
    <div role="listitem" className={`bg-bg-surface border rounded-xl overflow-hidden flex flex-col transition-all duration-200 ${containerCls}`}>
      {/* Thumbnail */}
      <a
        href={`https://www.youtube.com/watch?v=${result.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video bg-bg-inset cursor-pointer group block"
      >
        <Image
          src={result.thumbnailUrl}
          alt={result.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={36} className="text-white/80" />
        </div>
        <ScoreBadge score={result.relevanceScore} />
      </a>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug">{result.title}</p>
        <p className="text-xs text-text-tertiary">
          {result.channelName}
          {durationStr && ` · ${durationStr}`}
          {viewStr && ` · ${viewStr}`}
        </p>
        {result.aiAnalysis && (
          <p className="text-xs text-text-secondary italic line-clamp-2 leading-relaxed flex gap-1">
            <Quote size={11} className="text-text-tertiary flex-shrink-0 mt-0.5" />
            {result.aiAnalysis}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3 mt-auto">
        {status === 'pending' ? (
          <>
            <button
              aria-label={`Approve: ${result.title}`}
              onClick={() => onApprove(result)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCircle size={12} /> Approve
            </button>
            <button
              aria-label={`Reject: ${result.title}`}
              onClick={() => onReject(result.id)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-black/8 text-text-tertiary hover:border-red-400/20 hover:text-red-400 transition-colors"
            >
              <XCircle size={12} /> Reject
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1 text-xs py-2 px-1">
            {status === 'approved' ? (
              <><CheckCircle size={12} className="text-emerald-400" /><span className="text-emerald-400 font-medium">Approved</span></>
            ) : (
              <><XCircle size={12} className="text-text-tertiary" /><span className="text-text-tertiary">Rejected</span></>
            )}
            <button
              onClick={() => onUndo(result.id)}
              className="ml-2 underline text-text-tertiary hover:text-text-primary transition-colors"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'
type SortKey = 'relevance' | 'viewCount' | 'date'

export default function CrawlJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<CrawlJob | null>(null)
  const [results, setResults] = useState<CrawlResult[]>([])
  const [loading, setLoading] = useState(true)
  const [runningJob, setRunningJob] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [optimistic, setOptimistic] = useState<Record<string, string>>({})
  const [approveTarget, setApproveTarget] = useState<CrawlResult | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/crawl-jobs/${id}`)
    if (res.ok) {
      const data = await res.json()
      setJob(data)
      setResults(data.results ?? [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  // Poll while running
  useEffect(() => {
    if (job?.status !== 'running') return
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [job?.status, load])

  async function runJob() {
    setRunningJob(true)
    setJob(j => j ? { ...j, status: 'running' } : j)
    await fetch(`/api/admin/crawl-jobs/${id}/run`, { method: 'POST' })
    setRunningJob(false)
    await load()
  }

  function handleReject(resultId: string) {
    setOptimistic(o => ({ ...o, [resultId]: 'rejected' }))
    fetch(`/api/admin/crawl-jobs/${id}/results/${resultId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
  }

  function handleUndo(resultId: string) {
    setOptimistic(o => { const next = { ...o }; delete next[resultId]; return next })
  }

  function handleApproved(resultId: string, _clipId: string) {
    setOptimistic(o => ({ ...o, [resultId]: 'approved' }))
    setApproveTarget(null)
  }

  // Filtered + sorted results
  const filtered = results
    .filter(r => {
      const status = optimistic[r.id] ?? r.status
      return filter === 'all' || status === filter
    })
    .sort((a, b) => {
      if (sort === 'relevance') return b.relevanceScore - a.relevanceScore
      if (sort === 'viewCount') return (b.viewCount ?? 0) - (a.viewCount ?? 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const counts = {
    all: results.length,
    pending: results.filter(r => (optimistic[r.id] ?? r.status) === 'pending').length,
    approved: results.filter(r => (optimistic[r.id] ?? r.status) === 'approved').length,
    rejected: results.filter(r => (optimistic[r.id] ?? r.status) === 'rejected').length,
  }

  if (loading) {
    return <div className="p-8 text-text-tertiary text-sm">Loading…</div>
  }
  if (!job) {
    return <div className="p-8 text-text-tertiary text-sm">Job not found.</div>
  }

  const keywords = (job.keywords as string[]) ?? []

  return (
    <div className="p-8 flex flex-col gap-6">
      <Link href="/admin/crawl-jobs" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors w-fit">
        <ArrowLeft size={12} /> All Jobs
      </Link>

      {/* Job header */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-bold text-text-primary">{job.name}</h1>
          <StatusChip status={job.status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-xs text-text-secondary">Skill: <strong className="text-text-primary">{job.skillCategory}</strong></span>
          {job.technique && <span className="text-xs text-text-secondary">Technique: <strong className="text-accent-400">{job.technique}</strong></span>}
          {keywords.length > 0 && <span className="text-xs text-text-secondary">Keywords: <strong className="text-text-primary">{keywords.join(', ')}</strong></span>}
          {job.difficulty && <span className="text-xs text-text-secondary">Difficulty: <strong className="text-text-primary capitalize">{job.difficulty}</strong></span>}
          <span className="text-xs text-text-tertiary">{new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-6">
          {(['all', 'approved', 'rejected'] as const).map(key => (
            <div key={key}>
              <p className="text-sm font-semibold text-text-primary">{counts[key]}</p>
              <p className="text-xs text-text-tertiary capitalize">{key === 'all' ? 'results' : key}</p>
            </div>
          ))}
        </div>
        {(job.status === 'pending' || job.status === 'failed' || job.status === 'complete') && (
          <div className="flex items-center gap-3">
            <button
              onClick={runJob}
              disabled={runningJob}
              className="inline-flex items-center gap-1.5 bg-accent-400 text-bg-base text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              <Play size={11} />
              {runningJob ? 'Starting…' : job.status === 'complete' ? 'Re-run Job' : 'Run Job'}
            </button>
            {job.errorMessage && (
              <p className="text-xs text-red-400">{job.errorMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Running state */}
      {job.status === 'running' && (
        <div className="bg-bg-elevated border border-black/8 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <RefreshCw size={28} className="text-amber-400 animate-spin" />
          <p className="text-sm font-medium text-text-primary">Running job…</p>
          <p className="text-xs text-text-tertiary">Searching YouTube and scoring results with AI. This may take 30–60 seconds.</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Filter + Sort bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-1 bg-bg-inset rounded-xl p-1">
              {(['all', 'pending', 'approved', 'rejected'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
                    filter === tab
                      ? 'bg-bg-elevated text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {tab} <span className="text-text-tertiary ml-0.5">{counts[tab]}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">Sort:</span>
              {(['relevance', 'viewCount', 'date'] as SortKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${
                    sort === key
                      ? 'border-black/20 text-text-primary bg-black/5'
                      : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {key === 'viewCount' ? 'Views' : key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <p className="text-text-tertiary text-sm py-8 text-center">No {filter} results.</p>
          ) : (
            <div role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(result => (
                <ResultCard
                  key={result.id}
                  result={result}
                  optimisticStatus={optimistic[result.id] ?? null}
                  onApprove={setApproveTarget}
                  onReject={handleReject}
                  onUndo={handleUndo}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {results.length === 0 && job.status === 'complete' && (
        <div className="text-center py-12 text-text-tertiary text-sm">
          No results found for this job. Try different keywords.
        </div>
      )}

      {/* Approve modal */}
      {approveTarget && (
        <ApproveModal
          result={approveTarget}
          jobId={id}
          onClose={() => setApproveTarget(null)}
          onApproved={handleApproved}
        />
      )}
    </div>
  )
}
