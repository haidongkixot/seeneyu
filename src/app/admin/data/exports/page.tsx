'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Download, Loader2, Play } from 'lucide-react'

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

export default function ExportsPage() {
  const [exports, setExports] = useState<ExportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/data/exports')
      .then(r => r.json())
      .then(data => { setExports(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  async function triggerExport(id: string) {
    setProcessingId(id)
    const res = await fetch(`/api/admin/data/exports/${id}`, { method: 'POST' })
    if (res.ok) {
      // Refresh
      const updated = await fetch('/api/admin/data/exports').then(r => r.json())
      setExports(Array.isArray(updated) ? updated : [])
    }
    setProcessingId(null)
  }

  const statusStyles: Record<string, string> = {
    pending: 'bg-accent-400/20 text-accent-400',
    processing: 'bg-blue-400/20 text-blue-400',
    complete: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Exports</h1>
          <p className="text-text-secondary text-sm mt-1">{exports.length} exports</p>
        </div>
        <Link
          href="/admin/data/exports/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors"
        >
          <Plus size={14} />
          New Export
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-text-muted" size={24} />
        </div>
      ) : exports.length === 0 ? (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-8 text-center text-text-muted text-sm">
          No exports yet.
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
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Created</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Completed</th>
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
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {exp.completedAt ? new Date(exp.completedAt).toLocaleDateString() : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {exp.status === 'pending' && (
                        <button
                          onClick={() => triggerExport(exp.id)}
                          disabled={processingId === exp.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingId === exp.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          Run
                        </button>
                      )}
                      {exp.status === 'complete' && exp.fileUrl && (
                        <a
                          href={exp.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                        >
                          <Download size={12} />
                          Download
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
