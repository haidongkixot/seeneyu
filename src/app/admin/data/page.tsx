'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Database, Download, Tag, FileOutput, Loader2 } from 'lucide-react'

interface Stats {
  totalSubmissions: number
  labeled: number
  unlabeled: number
  totalExports: number
  labelDistribution: Array<{ label: string; count: number }>
}

interface ExportRecord {
  id: string
  name: string
  format: string
  status: string
  recordCount: number
  fileUrl: string | null
  createdAt: string
  completedAt: string | null
}

export default function DataPipelinePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [exports, setExports] = useState<ExportRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/data/stats').then(r => r.json()),
      fetch('/api/admin/data/exports').then(r => r.json()),
    ]).then(([s, e]) => {
      setStats(s)
      setExports(Array.isArray(e) ? e.slice(0, 5) : [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Submissions', value: stats?.totalSubmissions ?? 0, icon: <Database size={18} className="text-blue-400" /> },
    { label: 'Labeled', value: stats?.labeled ?? 0, icon: <Tag size={18} className="text-green-400" /> },
    { label: 'Unlabeled', value: stats?.unlabeled ?? 0, icon: <Tag size={18} className="text-amber-400" /> },
    { label: 'Exports', value: stats?.totalExports ?? 0, icon: <FileOutput size={18} className="text-purple-400" /> },
  ]

  const statusStyles: Record<string, string> = {
    pending: 'bg-accent-400/20 text-accent-400',
    processing: 'bg-blue-400/20 text-blue-400',
    complete: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Data Pipeline</h1>
        <p className="text-text-secondary text-sm mt-1">Game data exports and training data labels</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-text-muted">{s.label}</span></div>
            <p className="text-2xl font-bold text-text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/data/exports/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors"
        >
          <FileOutput size={14} />
          New Export
        </Link>
        <Link
          href="/admin/data/exports"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bg-surface border border-black/8 text-text-primary rounded-lg hover:bg-bg-overlay transition-colors"
        >
          <Download size={14} />
          All Exports
        </Link>
        <Link
          href="/admin/data/labels"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bg-surface border border-black/8 text-text-primary rounded-lg hover:bg-bg-overlay transition-colors"
        >
          <Tag size={14} />
          Labels
        </Link>
      </div>

      {/* Recent exports table */}
      <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Exports</h2>
      {exports.length === 0 ? (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-8 text-center text-text-muted text-sm">
          No exports yet. Create your first export to get started.
        </div>
      ) : (
        <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Name</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Format</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Records</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Date</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exports.map(exp => (
                <tr key={exp.id} className="border-b border-black/[0.04] hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{exp.name}</td>
                  <td className="px-4 py-3 text-text-secondary uppercase text-xs">{exp.format}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[exp.status] || 'bg-bg-inset text-text-muted'}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{exp.recordCount}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{new Date(exp.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {exp.status === 'complete' && exp.fileUrl && (
                      <a
                        href={exp.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
                      >
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Label distribution */}
      {stats && stats.labelDistribution.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Label Distribution</h2>
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <div className="space-y-2">
              {stats.labelDistribution.map(d => {
                const maxCount = Math.max(...stats.labelDistribution.map(x => x.count))
                const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary w-28 truncate capitalize">{d.label}</span>
                    <div className="flex-1 h-2 bg-bg-inset rounded-full overflow-hidden">
                      <div className="h-full bg-accent-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-text-muted w-10 text-right">{d.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
