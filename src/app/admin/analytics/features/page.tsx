'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Cpu, Database, Gauge, Target } from 'lucide-react'

interface FeatureData {
  crawlStats: { total: number; complete: number; failed: number; running: number; pending: number }
  crawlResults: { total: number; approved: number; rejected: number; approvalRate: number }
  avgResultsPerJob: number
  mediaPipe: { totalAnalyses: number; avgDurationMs: number; faceDetectionRate: number; poseDetectionRate: number; avgSnapshotCount: number }
  scoreDistribution: Record<string, number[]>
  contentPipeline: { fromCrawl: number; manual: number; total: number }
}

export default function FeaturePerformancePage() {
  const [data, setData] = useState<FeatureData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics/features')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Feature Performance</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-text-muted">Failed to load.</div>

  const bucketLabels = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90-100']

  return (
    <div className="p-8">
      <Link href="/admin/analytics" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Analytics
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
        <Cpu size={24} />
        Feature Performance
      </h1>
      <p className="text-text-secondary text-sm mb-6">Crawling pipeline and MediaPipe analysis metrics</p>

      {/* Crawl Job Stats */}
      <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Database size={16} />
        Crawl Pipeline
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Jobs" value={data.crawlStats.total} />
        <StatCard label="Complete" value={data.crawlStats.complete} color="text-success" />
        <StatCard label="Failed" value={data.crawlStats.failed} color="text-error" />
        <StatCard label="Avg Results/Job" value={data.avgResultsPerJob} />
        <StatCard label="Approval Rate" value={`${data.crawlResults.approvalRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Crawl results breakdown */}
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Crawl Results</h3>
          <div className="flex flex-col gap-3">
            <BarRow label="Approved" value={data.crawlResults.approved} max={data.crawlResults.total} color="bg-success/70" />
            <BarRow label="Rejected" value={data.crawlResults.rejected} max={data.crawlResults.total} color="bg-error/70" />
            <BarRow label="Pending" value={data.crawlResults.total - data.crawlResults.approved - data.crawlResults.rejected} max={data.crawlResults.total} color="bg-warning/70" />
          </div>
        </div>

        {/* Content pipeline */}
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Content Pipeline</h3>
          <div className="flex flex-col gap-3">
            <BarRow label="From Crawl" value={data.contentPipeline.fromCrawl} max={data.contentPipeline.total} color="bg-accent-400/70" />
            <BarRow label="Manual" value={data.contentPipeline.manual} max={data.contentPipeline.total} color="bg-violet-400/70" />
          </div>
          <p className="text-xs text-text-tertiary mt-3">{data.contentPipeline.total} total clips</p>
        </div>
      </div>

      {/* MediaPipe Stats */}
      <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Gauge size={16} />
        MediaPipe Performance
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Analyses" value={data.mediaPipe.totalAnalyses} />
        <StatCard label="Avg Duration" value={`${data.mediaPipe.avgDurationMs}ms`} />
        <StatCard label="Face Detection" value={`${data.mediaPipe.faceDetectionRate}%`} />
        <StatCard label="Pose Detection" value={`${data.mediaPipe.poseDetectionRate}%`} />
        <StatCard label="Avg Snapshots" value={data.mediaPipe.avgSnapshotCount} />
      </div>

      {/* Score Distribution */}
      {Object.keys(data.scoreDistribution).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Target size={16} />
            Score Distribution
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(data.scoreDistribution).map(([type, buckets]) => {
              const maxBucket = Math.max(...buckets, 1)
              return (
                <div key={type} className="bg-bg-surface border border-white/8 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 capitalize">{type.replace(/_/g, ' ')}</h3>
                  <div className="flex items-end gap-1 h-24">
                    {buckets.map((count, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-accent-400/60 hover:bg-accent-400 rounded-t transition-colors"
                          style={{ height: `${Math.max((count / maxBucket) * 100, 2)}%` }}
                          title={`${bucketLabels[i]}: ${count}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-text-tertiary">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-bg-surface border border-white/8 rounded-2xl p-4">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color || 'text-text-primary'}`}>{value}</p>
    </div>
  )
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs text-text-tertiary">{value}</span>
      </div>
      <div className="h-2 bg-white/8 rounded-pill overflow-hidden">
        <div
          className={`h-full rounded-pill ${color}`}
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}
