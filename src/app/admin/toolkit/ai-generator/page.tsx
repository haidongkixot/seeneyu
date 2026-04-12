'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Sparkles, Clock, Eye, CheckCircle2, XCircle,
  Image, ChevronLeft, ChevronRight, Trash2, ExternalLink, Bot,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface AiRequest {
  id: string
  expressionType: string
  bodyLanguageType: string
  scenePrompt: string | null
  provider: string
  model: string
  status: string
  createdAt: string
  _count: { assets: number }
  assets: { id: string; status: string; blobUrl: string | null }[]
}

interface Stats {
  total: number
  byStatus: { draft: number; generating: number; review: number; published: number; failed: number }
  totalAssets: number
}

type StatusFilter = 'all' | 'draft' | 'generating' | 'review' | 'published' | 'failed'
type ExpressionFilter = 'all' | 'happiness' | 'sadness' | 'anger' | 'surprise' | 'fear' | 'disgust' | 'contempt'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'generating', label: 'Generating' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
]

const EXPRESSION_OPTIONS: { value: ExpressionFilter; label: string }[] = [
  { value: 'all', label: 'All Expressions' },
  { value: 'happiness', label: 'Happiness' },
  { value: 'sadness', label: 'Sadness' },
  { value: 'anger', label: 'Anger' },
  { value: 'surprise', label: 'Surprise' },
  { value: 'fear', label: 'Fear' },
  { value: 'disgust', label: 'Disgust' },
  { value: 'contempt', label: 'Contempt' },
]

// ── Status Badge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-blue-500/20 text-blue-400',
    generating: 'bg-amber-500/20 text-amber-400',
    review: 'bg-purple-500/20 text-purple-400',
    published: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {status === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {status}
    </span>
  )
}

// ── Stats Cards ──────────────────────────────────────────────────────

function StatsCards({ stats }: { stats: Stats | null }) {
  if (!stats) return null
  const cards = [
    { label: 'Total Requests', value: stats.total, Icon: Sparkles, color: 'text-accent-400' },
    { label: 'In Review', value: stats.byStatus.review, Icon: Eye, color: 'text-purple-400' },
    { label: 'Generating', value: stats.byStatus.generating, Icon: Clock, color: 'text-amber-400' },
    { label: 'Published', value: stats.byStatus.published, Icon: CheckCircle2, color: 'text-emerald-400' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-bg-surface border border-black/8 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <c.Icon size={14} className={c.color} />
            <span className="text-xs text-text-muted">{c.label}</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function AiGeneratorPage() {
  const [requests, setRequests] = useState<AiRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expressionFilter, setExpressionFilter] = useState<ExpressionFilter>('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (expressionFilter !== 'all') params.set('expressionType', expressionFilter)

    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/requests?${params}`)
      const data = await res.json()
      setRequests(data.items ?? [])
      setPages(data.pages ?? 1)
      setTotal(data.total ?? 0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, statusFilter, expressionFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/toolkit/ai-generator/stats')
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchStats()
  }, [fetchRequests, fetchStats])

  async function deleteRequest(id: string) {
    if (!confirm('Delete this generation request and all its assets?')) return
    setActionLoading(id)
    await fetch(`/api/admin/toolkit/ai-generator/requests/${id}`, { method: 'DELETE' })
    fetchRequests()
    fetchStats()
    setActionLoading(null)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/toolkit" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3">
          <ArrowLeft size={12} /> Back to Toolkit
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">AI Content Generator</h1>
            <p className="text-text-secondary text-sm mt-1">
              Generate expression and body language reference images with AI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/toolkit/practice-ideating"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-overlay border border-black/8 rounded-xl transition-colors"
            >
              <Sparkles size={14} /> Practice Ideating Batches &rarr;
            </Link>
            <Link
              href="/admin/toolkit/ai-generator/agent"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-accent-400/30 text-accent-400 rounded-xl hover:bg-accent-400/10 transition-colors"
            >
              <Bot size={14} /> Content Agent
            </Link>
            <Link
              href="/admin/toolkit/ai-generator/new"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-xl hover:bg-accent-300 transition-colors"
            >
              <Plus size={14} /> New Content
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1) }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                statusFilter === s.value
                  ? 'bg-bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
          {EXPRESSION_OPTIONS.map((e) => (
            <button
              key={e.value}
              onClick={() => { setExpressionFilter(e.value); setPage(1) }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                expressionFilter === e.value
                  ? 'bg-bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Expression</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Body Language</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Provider</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Assets</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Created</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted">No generation requests found.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-b border-black/[0.04] hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-text-primary font-medium capitalize">{r.expressionType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                      {r.bodyLanguageType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-secondary">{r.provider}/{r.model}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Image size={11} className="text-text-muted" />
                      <span className="text-xs text-text-secondary">{r._count.assets}</span>
                      {r.assets.some((a) => a.status === 'ready') && (
                        <span className="text-[9px] text-emerald-400 ml-1">
                          {r.assets.filter((a) => a.status === 'ready').length} ready
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/toolkit/ai-generator/${r.id}`}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
                      >
                        <ExternalLink size={11} /> View
                      </Link>
                      <button
                        onClick={() => deleteRequest(r.id)}
                        disabled={actionLoading === r.id}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
            <span className="text-xs text-text-muted">{total} total</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-text-secondary px-2">{page} / {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
