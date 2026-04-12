'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Film, Loader2, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react'

interface Collection {
  batchId: string
  batchName: string
  requestCount: number
  totalAssets: number
  readyAssets: number
  generatingAssets: number
  failedAssets: number
  provider: string
  overallStatus: string
  createdAt: string
}

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

export default function CollectionsListPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/toolkit/ai-generator/collections')
      .then(r => r.json())
      .then(data => setCollections(data.collections || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/admin/toolkit/ai-generator" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4">
        <ArrowLeft size={14} />
        Back to AI Generator
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Film size={22} className="text-accent-400" />
          Practice Collections
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Video collections generated from Practice Ideating batches. Each collection contains main videos + step-by-step guideline videos for a complete set of practices.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-tertiary">
          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
          Loading collections...
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-12 text-center">
          <Film size={32} className="text-text-tertiary mx-auto mb-3" />
          <p className="text-text-primary font-semibold mb-1">No collections yet</p>
          <p className="text-text-secondary text-sm mb-5">
            Push a Practice Ideating batch to the AI Generator to create your first collection.
          </p>
          <Link
            href="/admin/toolkit/practice-ideating"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 transition-colors"
          >
            <Sparkles size={16} />
            Go to Practice Ideating
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((col) => {
            const pct = col.totalAssets > 0
              ? Math.round(((col.readyAssets + col.failedAssets) / col.totalAssets) * 100)
              : 0

            return (
              <Link
                key={col.batchId}
                href={`/admin/toolkit/ai-generator/collections/${col.batchId}`}
                className="block bg-bg-surface border border-black/8 rounded-2xl p-5 hover:border-accent-400/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-text-primary font-semibold group-hover:text-accent-400 transition-colors truncate">
                        {col.batchName}
                      </h3>
                      <StatusBadge status={col.overallStatus} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span>{col.requestCount} practices</span>
                      <span>·</span>
                      <span>{col.totalAssets} videos</span>
                      <span>·</span>
                      <span>{col.provider}</span>
                      <span>·</span>
                      <span>{new Date(col.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      {col.readyAssets > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 size={12} /> {col.readyAssets}
                        </span>
                      )}
                      {col.generatingAssets > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Clock size={12} /> {col.generatingAssets}
                        </span>
                      )}
                      {col.failedAssets > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle size={12} /> {col.failedAssets}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="mt-3 w-full h-1.5 bg-bg-inset rounded-full overflow-hidden flex">
                  {col.readyAssets > 0 && (
                    <div className="h-full bg-emerald-400" style={{ width: `${(col.readyAssets / col.totalAssets) * 100}%` }} />
                  )}
                  {col.failedAssets > 0 && (
                    <div className="h-full bg-red-400" style={{ width: `${(col.failedAssets / col.totalAssets) * 100}%` }} />
                  )}
                  {col.generatingAssets > 0 && (
                    <div className="h-full bg-amber-400 animate-pulse" style={{ width: `${(col.generatingAssets / col.totalAssets) * 100}%` }} />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
