'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Sparkles, CheckCircle2, XCircle, FileText, Image,
  ExternalLink, Search, X, Clock, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface ContentSource {
  id: string
  type: string
  url: string
  title: string
  rawContent: string | null
  metadata: any
  status: string
  curatedBy: string | null
  curatedAt: string | null
  createdAt: string
}

interface ExpressionAsset {
  id: string
  imageUrl: string
  sourceUrl: string | null
  label: string
  description: string | null
  tags: string[]
  confidence: number | null
  userVotes: number
  status: string
  createdAt: string
}

type Tab = 'sources' | 'expressions'
type SourceType = 'all' | 'article' | 'research_paper' | 'expression_db' | 'youtube_timestamp'
type SourceStatus = 'all' | 'raw' | 'curated' | 'published' | 'rejected'

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'article', label: 'Article' },
  { value: 'research_paper', label: 'Research' },
  { value: 'expression_db', label: 'Expression DB' },
  { value: 'youtube_timestamp', label: 'YT Timestamp' },
]

const SOURCE_STATUSES: { value: SourceStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'raw', label: 'Raw' },
  { value: 'curated', label: 'Curated' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
]

const EXPRESSION_LABELS = [
  'all', 'anger', 'contempt', 'disgust', 'fear', 'happiness',
  'sadness', 'surprise', 'neutral', 'confusion', 'interest',
]

// ── Status Badge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    raw: 'bg-blue-500/20 text-blue-400',
    curated: 'bg-accent-400/20 text-accent-400',
    published: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
    pending: 'bg-accent-400/20 text-accent-400',
    verified: 'bg-emerald-500/20 text-emerald-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    article: 'bg-blue-500/15 text-blue-400',
    research_paper: 'bg-purple-500/15 text-purple-400',
    expression_db: 'bg-pink-500/15 text-pink-400',
    youtube_timestamp: 'bg-red-500/15 text-red-400',
  }
  const labels: Record<string, string> = {
    article: 'Article',
    research_paper: 'Research',
    expression_db: 'Expression DB',
    youtube_timestamp: 'YT Timestamp',
  }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[type] || 'bg-bg-inset text-text-muted'}`}>
      {labels[type] || type}
    </span>
  )
}

// ── Add Source Modal ──────────────────────────────────────────────────

function AddSourceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [url, setUrl] = useState('')
  const [type, setType] = useState<string>('article')
  const [title, setTitle] = useState('')
  const [crawl, setCrawl] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/admin/toolkit/crawler/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type, title: title || undefined, crawl }),
    })

    if (res.ok) {
      onCreated()
      onClose()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create source')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Add Content Source</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            >
              <option value="article">Article</option>
              <option value="research_paper">Research Paper</option>
              <option value="expression_db">Expression Database</option>
              <option value="youtube_timestamp">YouTube Timestamp</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Auto-detected if crawled"
              className="w-full bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
            />
          </div>

          {(type === 'article' || type === 'research_paper') && (
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={crawl}
                onChange={e => setCrawl(e.target.checked)}
                className="rounded border-white/20 bg-bg-inset accent-accent-400"
              />
              Auto-crawl content from URL
            </label>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-sm font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function AdminCrawlerPage() {
  const [tab, setTab] = useState<Tab>('sources')
  const [sources, setSources] = useState<ContentSource[]>([])
  const [expressions, setExpressions] = useState<ExpressionAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Source filters
  const [typeFilter, setTypeFilter] = useState<SourceType>('all')
  const [statusFilter, setStatusFilter] = useState<SourceStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sourcePage, setSourcePage] = useState(1)
  const [sourcePages, setSourcePages] = useState(1)
  const [sourceTotal, setSourceTotal] = useState(0)

  // Expression filters
  const [labelFilter, setLabelFilter] = useState('all')
  const [exprStatusFilter, setExprStatusFilter] = useState('all')
  const [exprPage, setExprPage] = useState(1)
  const [exprPages, setExprPages] = useState(1)
  const [exprTotal, setExprTotal] = useState(0)

  // Action loading state
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(sourcePage) })
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (searchQuery) params.set('search', searchQuery)

    try {
      const res = await fetch(`/api/admin/toolkit/crawler/jobs?${params}`)
      const data = await res.json()
      setSources(data.items ?? [])
      setSourcePages(data.pages ?? 1)
      setSourceTotal(data.total ?? 0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [sourcePage, typeFilter, statusFilter, searchQuery])

  const fetchExpressions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(exprPage) })
    if (labelFilter !== 'all') params.set('label', labelFilter)
    if (exprStatusFilter !== 'all') params.set('status', exprStatusFilter)

    try {
      const res = await fetch(`/api/admin/toolkit/crawler/expressions?${params}`)
      const data = await res.json()
      setExpressions(data.items ?? [])
      setExprPages(data.pages ?? 1)
      setExprTotal(data.total ?? 0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [exprPage, labelFilter, exprStatusFilter])

  useEffect(() => {
    if (tab === 'sources') fetchSources()
    else fetchExpressions()
  }, [tab, fetchSources, fetchExpressions])

  // ── Source actions ──

  async function updateSourceStatus(id: string, status: string) {
    setActionLoading(id)
    const res = await fetch(`/api/admin/toolkit/crawler/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) fetchSources()
    setActionLoading(null)
  }

  async function deleteSource(id: string) {
    if (!confirm('Delete this content source?')) return
    setActionLoading(id)
    await fetch(`/api/admin/toolkit/crawler/jobs/${id}`, { method: 'DELETE' })
    fetchSources()
    setActionLoading(null)
  }

  async function enrichSource(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/toolkit/crawler/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: id }),
      })
      if (res.ok) {
        fetchSources()
      } else {
        const data = await res.json()
        alert(`Enrichment failed: ${data.error}`)
      }
    } catch {
      alert('Enrichment request failed')
    }
    setActionLoading(null)
  }

  // ── Expression actions ──

  async function updateExpressionStatus(id: string, status: string) {
    setActionLoading(id)
    const res = await fetch(`/api/admin/toolkit/crawler/expressions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) fetchExpressions()
    setActionLoading(null)
  }

  async function deleteExpression(id: string) {
    if (!confirm('Delete this expression asset?')) return
    setActionLoading(id)
    await fetch(`/api/admin/toolkit/crawler/expressions/${id}`, { method: 'DELETE' })
    fetchExpressions()
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
            <h1 className="text-2xl font-bold text-text-primary">Data Crawler</h1>
            <p className="text-text-secondary text-sm mt-1">
              Manage content sources and expression assets for training data.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-xl hover:bg-accent-300 transition-colors"
          >
            <Plus size={14} /> Add Source
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-bg-inset rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('sources')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
            tab === 'sources'
              ? 'bg-bg-surface text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <FileText size={12} /> Content Sources
          {sourceTotal > 0 && <span className="ml-1 text-[10px] text-text-muted">({sourceTotal})</span>}
        </button>
        <button
          onClick={() => setTab('expressions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
            tab === 'expressions'
              ? 'bg-bg-surface text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Image size={12} /> Expression Assets
          {exprTotal > 0 && <span className="ml-1 text-[10px] text-text-muted">({exprTotal})</span>}
        </button>
      </div>

      {/* ── Content Sources Tab ── */}
      {tab === 'sources' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
              {SOURCE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setTypeFilter(t.value); setSourcePage(1) }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                    typeFilter === t.value
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
              {SOURCE_STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setStatusFilter(s.value); setSourcePage(1) }}
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
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSourcePage(1) }}
                placeholder="Search title or URL..."
                className="pl-7 pr-3 py-1.5 text-xs bg-bg-inset border border-white/10 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50 w-52"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Enrichment</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Created</th>
                  <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-text-muted">Loading...</td></tr>
                ) : sources.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-text-muted">No content sources found.</td></tr>
                ) : (
                  sources.map(source => {
                    const enrichment = (source.metadata as any)?.enrichment
                    return (
                      <tr key={source.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                        <td className="px-4 py-3 max-w-[300px]">
                          <p className="text-text-primary font-medium truncate">{source.title}</p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-accent-400 truncate mt-0.5"
                          >
                            <ExternalLink size={9} /> {source.url}
                          </a>
                        </td>
                        <td className="px-4 py-3"><TypeBadge type={source.type} /></td>
                        <td className="px-4 py-3"><StatusBadge status={source.status} /></td>
                        <td className="px-4 py-3">
                          {enrichment ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-accent-400">{enrichment.relevanceScore}/10</span>
                              <span className="text-[10px] text-text-muted">{enrichment.tags?.length ?? 0} tags</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted">Not enriched</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          {new Date(source.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => enrichSource(source.id)}
                              disabled={actionLoading === source.id}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Enrich with AI"
                            >
                              <Sparkles size={11} /> Enrich
                            </button>
                            {source.status === 'raw' && (
                              <>
                                <button
                                  onClick={() => updateSourceStatus(source.id, 'curated')}
                                  disabled={actionLoading === source.id}
                                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 size={11} /> Approve
                                </button>
                                <button
                                  onClick={() => updateSourceStatus(source.id, 'rejected')}
                                  disabled={actionLoading === source.id}
                                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <XCircle size={11} /> Reject
                                </button>
                              </>
                            )}
                            {source.status === 'curated' && (
                              <button
                                onClick={() => updateSourceStatus(source.id, 'published')}
                                disabled={actionLoading === source.id}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <CheckCircle2 size={11} /> Publish
                              </button>
                            )}
                            <button
                              onClick={() => deleteSource(source.id)}
                              disabled={actionLoading === source.id}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {sourcePages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <span className="text-xs text-text-muted">{sourceTotal} total</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSourcePage(p => Math.max(1, p - 1))}
                    disabled={sourcePage === 1}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-text-secondary px-2">{sourcePage} / {sourcePages}</span>
                  <button
                    onClick={() => setSourcePage(p => Math.min(sourcePages, p + 1))}
                    disabled={sourcePage === sourcePages}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Expression Assets Tab ── */}
      {tab === 'expressions' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5 flex-wrap">
              {EXPRESSION_LABELS.map(l => (
                <button
                  key={l}
                  onClick={() => { setLabelFilter(l); setExprPage(1) }}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all capitalize ${
                    labelFilter === l
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
              {(['all', 'pending', 'verified', 'rejected'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setExprStatusFilter(s); setExprPage(1) }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize ${
                    exprStatusFilter === s
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-text-muted">Loading...</div>
            ) : expressions.length === 0 ? (
              <div className="text-center py-12 text-text-muted">No expression assets found.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {expressions.map(asset => (
                  <div key={asset.id} className="bg-bg-overlay border border-white/5 rounded-xl overflow-hidden group">
                    <div className="aspect-square bg-bg-inset relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.imageUrl}
                        alt={asset.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={asset.status} />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary capitalize">{asset.label}</span>
                        {asset.confidence !== null && (
                          <span className="text-[10px] text-text-muted">{Math.round(asset.confidence * 100)}%</span>
                        )}
                      </div>
                      {asset.description && (
                        <p className="text-[11px] text-text-muted line-clamp-2 mb-2">{asset.description}</p>
                      )}
                      {Array.isArray(asset.tags) && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(asset.tags as string[]).slice(0, 4).map((tag, i) => (
                            <span key={i} className="text-[9px] bg-bg-inset text-text-muted rounded px-1 py-0.5">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                        {asset.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateExpressionStatus(asset.id, 'verified')}
                              disabled={actionLoading === asset.id}
                              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={10} /> Verify
                            </button>
                            <button
                              onClick={() => updateExpressionStatus(asset.id, 'rejected')}
                              disabled={actionLoading === asset.id}
                              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                            >
                              <XCircle size={10} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteExpression(asset.id)}
                          disabled={actionLoading === asset.id}
                          className="p-1 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {exprPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <span className="text-xs text-text-muted">{exprTotal} total</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExprPage(p => Math.max(1, p - 1))}
                    disabled={exprPage === 1}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-text-secondary px-2">{exprPage} / {exprPages}</span>
                  <button
                    onClick={() => setExprPage(p => Math.min(exprPages, p + 1))}
                    disabled={exprPage === exprPages}
                    className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => fetchSources()}
        />
      )}
    </div>
  )
}
