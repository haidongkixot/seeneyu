import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET() {
  try {
    await requireAdmin()

    // Crawl job stats
    const crawlJobs = await prisma.crawlJob.groupBy({
      by: ['status'],
      _count: { id: true },
    })
    const crawlStats = {
      total: crawlJobs.reduce((a, b) => a + b._count.id, 0),
      complete: crawlJobs.find(j => j.status === 'complete')?._count.id ?? 0,
      failed: crawlJobs.find(j => j.status === 'failed')?._count.id ?? 0,
      running: crawlJobs.find(j => j.status === 'running')?._count.id ?? 0,
      pending: crawlJobs.find(j => j.status === 'pending')?._count.id ?? 0,
    }

    // Crawl results approval rate
    const crawlResults = await prisma.crawlResult.groupBy({
      by: ['status'],
      _count: { id: true },
    })
    const totalResults = crawlResults.reduce((a, b) => a + b._count.id, 0)
    const approvedResults = crawlResults.find(r => r.status === 'approved')?._count.id ?? 0
    const rejectedResults = crawlResults.find(r => r.status === 'rejected')?._count.id ?? 0

    // Average results per job
    const avgResultsPerJob = crawlStats.total > 0
      ? Math.round(totalResults / crawlStats.total)
      : 0

    // MediaPipe analysis metrics
    const allMetrics = await (prisma as any).analysisMetric.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })

    const metricsCount = allMetrics.length
    const avgDurationMs = metricsCount > 0
      ? Math.round(allMetrics.reduce((a: number, m: any) => a + m.durationMs, 0) / metricsCount)
      : 0
    const faceDetectionRate = metricsCount > 0
      ? Math.round((allMetrics.filter((m: any) => m.faceDetected).length / metricsCount) * 100)
      : 0
    const poseDetectionRate = metricsCount > 0
      ? Math.round((allMetrics.filter((m: any) => m.poseDetected).length / metricsCount) * 100)
      : 0
    const avgSnapshotCount = metricsCount > 0
      ? Math.round(allMetrics.reduce((a: number, m: any) => a + m.snapshotCount, 0) / metricsCount)
      : 0

    // Score distribution by session type
    const scoresByType: Record<string, number[]> = {}
    for (const m of allMetrics) {
      if (m.score != null) {
        if (!scoresByType[m.sessionType]) scoresByType[m.sessionType] = []
        scoresByType[m.sessionType].push(m.score)
      }
    }

    // Build histogram buckets (0-10, 10-20, ..., 90-100)
    const scoreDistribution: Record<string, number[]> = {}
    for (const [type, scores] of Object.entries(scoresByType)) {
      const buckets = new Array(10).fill(0)
      for (const s of scores) {
        const idx = Math.min(Math.floor(s / 10), 9)
        buckets[idx]++
      }
      scoreDistribution[type] = buckets
    }

    // Content pipeline: clips from crawl vs manual
    const crawlClipCount = await prisma.crawlResult.count({ where: { status: 'approved', approvedClipId: { not: null } } })
    const totalClipCount = await prisma.clip.count()

    return NextResponse.json({
      crawlStats,
      crawlResults: {
        total: totalResults,
        approved: approvedResults,
        rejected: rejectedResults,
        approvalRate: totalResults > 0 ? Math.round((approvedResults / totalResults) * 100) : 0,
      },
      avgResultsPerJob,
      mediaPipe: {
        totalAnalyses: metricsCount,
        avgDurationMs,
        faceDetectionRate,
        poseDetectionRate,
        avgSnapshotCount,
      },
      scoreDistribution,
      contentPipeline: {
        fromCrawl: crawlClipCount,
        manual: totalClipCount - crawlClipCount,
        total: totalClipCount,
      },
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
