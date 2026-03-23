'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import type { CrawlJob } from '@/lib/types'

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; animated?: boolean }> = {
    pending:  { label: '○ PENDING',   cls: 'bg-white/5 text-text-secondary border-white/10' },
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

type JobRow = CrawlJob & { _count: { results: number } }

function JobListRow({ job, onRun, running }: { job: JobRow; onRun: (id: string) => void; running: boolean }) {
  const keywords = (job.keywords as string[]) ?? []
  return (
    <div className="bg-bg-surface border border-white/8 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-white/15 transition-colors">
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{job.name}</p>
        <p className="text-xs text-text-secondary">
          {job.skillCategory}
          {job.technique && <span className="ml-1.5 text-accent-400">· {job.technique}</span>}
          {job.status === 'complete' && (
            <span className="ml-2 text-text-tertiary">
              · {job._count?.results ?? 0} results
            </span>
          )}
        </p>
        <p className="text-xs text-text-tertiary">{new Date(job.createdAt).toLocaleDateString()}</p>
        {keywords.length > 0 && (
          <p className="text-xs text-text-tertiary truncate">"{keywords.join(', ')}"</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <StatusChip status={job.status} />
        {job.status === 'complete' ? (
          <Link
            href={`/admin/crawl-jobs/${job.id}`}
            className="border border-white/15 text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:border-white/30 hover:text-text-primary transition-colors whitespace-nowrap"
          >
            View Results →
          </Link>
        ) : job.status === 'failed' ? (
          <div className="flex gap-2">
            <button
              onClick={() => onRun(job.id)}
              disabled={running}
              className="border border-white/15 text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:border-white/30 hover:text-text-primary transition-colors"
            >
              Retry
            </button>
            <Link href={`/admin/crawl-jobs/${job.id}`} className="border border-white/15 text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:border-white/30 hover:text-text-primary transition-colors">View</Link>
          </div>
        ) : job.status === 'pending' ? (
          <button
            onClick={() => onRun(job.id)}
            disabled={running}
            className="bg-accent-400 text-bg-base text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            {running ? 'Starting…' : '▶ Run Job'}
          </button>
        ) : (
          <Link href={`/admin/crawl-jobs/${job.id}`} className="border border-white/15 text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:border-white/30 hover:text-text-primary transition-colors">View</Link>
        )}
      </div>
    </div>
  )
}

export default function CrawlJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [runningId, setRunningId] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/crawl-jobs')
    if (res.ok) {
      const data = await res.json()
      setJobs(data.jobs)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function runJob(id: string) {
    setRunningId(id)
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'running' as const } : j))
    await fetch(`/api/admin/crawl-jobs/${id}/run`, { method: 'POST' })
    await load()
    setRunningId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Learning Materials Builder</h1>
          <p className="text-sm text-text-secondary mt-1">Discover and curate new clips using AI-assisted YouTube search.</p>
        </div>
        <Link
          href="/admin/crawl-jobs/new"
          className="inline-flex items-center gap-2 bg-accent-400 text-bg-base font-semibold px-4 py-2 rounded-full text-sm hover:bg-amber-300 transition-colors"
        >
          <Plus size={14} />
          New Job
        </Link>
      </div>

      {loading ? (
        <div className="text-text-tertiary text-sm">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Search size={36} className="text-text-tertiary" strokeWidth={1.5} />
          <p className="text-text-secondary font-medium">No crawl jobs yet</p>
          <p className="text-text-tertiary text-sm max-w-xs">Create your first job to start discovering clips.</p>
          <Link href="/admin/crawl-jobs/new" className="mt-2 inline-flex items-center gap-2 bg-accent-400 text-bg-base font-semibold px-4 py-2 rounded-full text-sm hover:bg-amber-300 transition-colors">
            <Plus size={13} /> Create Job
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-4xl">
          {jobs.map(job => (
            <JobListRow
              key={job.id}
              job={job}
              onRun={runJob}
              running={runningId === job.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
