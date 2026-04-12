'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Lightbulb, Trash2, Download, Clock, CheckCircle2, XCircle, FileJson, FileText } from 'lucide-react'

interface Batch {
  id: string
  name: string
  status: 'draft' | 'generating' | 'complete' | 'failed'
  count: number
  error: string | null
  createdAt: string
  updatedAt: string
  config: {
    totalCount: number
    skills: Record<string, number>
    tone: string
    language: string
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-blue-500/20 text-blue-400',
    generating: 'bg-amber-500/20 text-amber-400',
    complete: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  const icons: Record<string, any> = {
    generating: Clock,
    complete: CheckCircle2,
    failed: XCircle,
  }
  const Icon = icons[status]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {status === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {Icon && status !== 'generating' && <Icon size={12} />}
      {status}
    </span>
  )
}

export default function PracticeIdeatingPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadBatches() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/toolkit/practice-ideating/batches')
      if (!res.ok) throw new Error('Failed to load batches')
      const data = await res.json()
      setBatches(data.batches || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBatches() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this batch? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/toolkit/practice-ideating/batches/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setBatches((prev) => prev.filter((b) => b.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  function exportUrl(id: string, format: 'json' | 'md') {
    return `/api/admin/toolkit/practice-ideating/batches/${id}/export?format=${format}`
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/admin/toolkit" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4">
        <ArrowLeft size={14} />
        Back to Toolkit
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Lightbulb size={22} className="text-accent-400" />
            Practice Ideating
          </h1>
          <p className="text-text-secondary text-sm mt-1 max-w-2xl">
            Generate batches of AI-designed practice ideas for the clip pipeline. Each batch contains main video prompts + observation guides + step-by-step practice prompts, ready to feed into your video generation tool.
          </p>
        </div>
        <Link
          href="/admin/toolkit/practice-ideating/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 transition-colors shrink-0"
        >
          <Plus size={16} />
          New Batch
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-tertiary">Loading batches...</div>
      ) : batches.length === 0 ? (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-12 text-center">
          <Lightbulb size={32} className="text-text-tertiary mx-auto mb-3" />
          <p className="text-text-primary font-semibold mb-1">No batches yet</p>
          <p className="text-text-secondary text-sm mb-5">Create your first batch of practice ideas to get started.</p>
          <Link
            href="/admin/toolkit/practice-ideating/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 transition-colors"
          >
            <Plus size={16} />
            New Batch
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-bg-surface border border-black/8 rounded-2xl p-5 hover:border-black/15 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/admin/toolkit/practice-ideating/${batch.id}`}
                  className="flex-1 min-w-0 group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-text-primary font-semibold group-hover:text-accent-400 transition-colors">
                      {batch.name}
                    </h3>
                    <StatusBadge status={batch.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <span>{batch.count || batch.config?.totalCount || 0} ideas</span>
                    <span>•</span>
                    <span>{batch.config?.tone || '—'}</span>
                    <span>•</span>
                    <span>{batch.config?.language || '—'}</span>
                    <span>•</span>
                    <span>{new Date(batch.createdAt).toLocaleString()}</span>
                  </div>
                  {batch.error && (
                    <p className="text-xs text-error mt-2 line-clamp-2">{batch.error}</p>
                  )}
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  {batch.status === 'complete' && (
                    <>
                      <a
                        href={exportUrl(batch.id, 'json')}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-text-secondary hover:text-text-primary hover:border-black/20 text-xs font-medium transition-colors"
                        title="Download JSON"
                      >
                        <FileJson size={12} />
                        JSON
                      </a>
                      <a
                        href={exportUrl(batch.id, 'md')}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-text-secondary hover:text-text-primary hover:border-black/20 text-xs font-medium transition-colors"
                        title="Download Markdown"
                      >
                        <FileText size={12} />
                        MD
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(batch.id)}
                    disabled={deleting === batch.id}
                    className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                    title="Delete batch"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
