'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Trash2, CheckCircle2, XCircle } from 'lucide-react'

interface ErrorLog {
  id: string
  level: string
  source: string
  message: string
  stack: string | null
  metadata: Record<string, unknown> | null
  userId: string | null
  resolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
}

type LevelFilter = 'all' | 'error' | 'warn' | 'info'
type ResolvedFilter = 'all' | 'unresolved' | 'resolved'

const LEVEL_TABS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Errors' },
  { value: 'warn', label: 'Warnings' },
  { value: 'info', label: 'Info' },
]

const SOURCES = ['api', 'client', 'user-report', 'cron']

function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    error: 'bg-red-500/20 text-red-400',
    warn: 'bg-amber-500/20 text-amber-400',
    info: 'bg-blue-500/20 text-blue-400',
  }
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[level] || 'bg-bg-inset text-text-muted'}`}>
      {level}
    </span>
  )
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-bg-inset text-text-secondary">
      {source}
    </span>
  )
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>('unresolved')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (levelFilter !== 'all') params.set('level', levelFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      if (resolvedFilter === 'resolved') params.set('resolved', 'true')
      if (resolvedFilter === 'unresolved') params.set('resolved', 'false')
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/admin/logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }, [levelFilter, sourceFilter, resolvedFilter, search, page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [levelFilter, sourceFilter, resolvedFilter, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const toggleResolved = async (log: ErrorLog) => {
    setActionLoading(log.id)
    try {
      await fetch(`/api/admin/logs/${log.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !log.resolved }),
      })
      fetchLogs()
    } finally {
      setActionLoading(null)
    }
  }

  const deleteLog = async (id: string) => {
    if (!confirm('Delete this log entry?')) return
    setActionLoading(id)
    try {
      await fetch(`/api/admin/logs/${id}`, { method: 'DELETE' })
      if (expandedId === id) setExpandedId(null)
      fetchLogs()
    } finally {
      setActionLoading(null)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Error Logs</h1>
          <p className="text-sm text-text-secondary mt-0.5">{total} log entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Level tabs */}
        <div className="flex bg-bg-elevated rounded-lg p-0.5 border border-black/[0.04]">
          {LEVEL_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLevelFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                levelFilter === value
                  ? 'bg-bg-overlay text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Source dropdown */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-bg-elevated border border-black/8 rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-400/40"
        >
          <option value="all">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Resolved toggle */}
        <div className="flex bg-bg-elevated rounded-lg p-0.5 border border-black/[0.04]">
          {(['unresolved', 'resolved', 'all'] as ResolvedFilter[]).map((val) => (
            <button
              key={val}
              onClick={() => setResolvedFilter(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                resolvedFilter === val
                  ? 'bg-bg-overlay text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-3 py-1.5 bg-bg-elevated border border-black/8 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-400/40"
            />
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-bg-elevated border border-black/8 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm">No log entries found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Level</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Message</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="border-b border-black/[0.04] hover:bg-bg-overlay/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5"><LevelBadge level={log.level} /></td>
                    <td className="px-4 py-2.5"><SourceBadge source={log.source} /></td>
                    <td className="px-4 py-2.5 text-text-primary max-w-[400px] truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">
                      {log.userId ? log.userId.slice(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.resolved ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 size={12} /> Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <XCircle size={12} /> Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleResolved(log)}
                          disabled={actionLoading === log.id}
                          className="p-1.5 rounded-lg hover:bg-bg-inset text-text-secondary hover:text-text-primary transition-colors"
                          title={log.resolved ? 'Unresolve' : 'Resolve'}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteLog(log.id)}
                          disabled={actionLoading === log.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-detail`} className="border-b border-black/[0.04]">
                      <td colSpan={7} className="px-4 py-4 bg-bg-inset/50">
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="font-medium text-text-secondary">Full message:</span>
                            <p className="mt-1 text-text-primary whitespace-pre-wrap">{log.message}</p>
                          </div>
                          {log.stack && (
                            <div>
                              <span className="font-medium text-text-secondary">Stack trace:</span>
                              <pre className="mt-1 text-red-400/80 bg-bg-base rounded-lg p-3 overflow-auto max-h-48 font-mono text-[11px]">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                          {log.metadata && (
                            <div>
                              <span className="font-medium text-text-secondary">Metadata:</span>
                              <pre className="mt-1 text-text-secondary bg-bg-base rounded-lg p-3 overflow-auto max-h-32 font-mono text-[11px]">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.resolved && log.resolvedBy && (
                            <div className="text-text-muted">
                              Resolved by {log.resolvedBy} at {log.resolvedAt ? formatTime(log.resolvedAt) : 'unknown'}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
            <p className="text-xs text-text-muted">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-bg-overlay text-text-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-bg-overlay text-text-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
