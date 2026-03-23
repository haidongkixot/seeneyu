import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { searchYouTube } from '@/services/youtube-crawler'
import { scoreClipsBatch } from '@/services/clip-relevance-scorer'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const job = await (prisma as any).crawlJob.findUnique({ where: { id } })
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (job.status === 'running') {
      return NextResponse.json({ error: 'Job is already running' }, { status: 409 })
    }

    // Mark running
    await (prisma as any).crawlJob.update({ where: { id }, data: { status: 'running' } })

    try {
      // Build query from job config
      const keywords = job.keywords as string[]
      const queryParts = [...keywords]
      if (job.technique) queryParts.push(job.technique)
      const query = queryParts.join(' ')

      // Search YouTube
      const candidates = await searchYouTube(query, job.maxResults)

      if (candidates.length === 0) {
        await (prisma as any).crawlJob.update({ where: { id }, data: { status: 'complete' } })
        return NextResponse.json({ message: 'No results found', count: 0 })
      }

      // Score all results
      const scores = await scoreClipsBatch(candidates, {
        skillCategory: job.skillCategory,
        technique: job.technique,
        difficulty: job.difficulty,
      })

      // Save results sorted by relevance
      const resultData = candidates
        .map((c, i) => ({
          jobId: id,
          youtubeId: c.youtubeId,
          title: c.title,
          channelName: c.channelName,
          thumbnailUrl: c.thumbnailUrl,
          description: c.description,
          durationSec: c.durationSec,
          publishedAt: c.publishedAt,
          viewCount: c.viewCount,
          relevanceScore: scores[i].score,
          aiAnalysis: scores[i].analysis,
          status: 'pending',
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)

      await (prisma as any).crawlResult.createMany({ data: resultData })
      await (prisma as any).crawlJob.update({ where: { id }, data: { status: 'complete' } })

      return NextResponse.json({ message: 'Job complete', count: resultData.length })
    } catch (runErr: any) {
      await (prisma as any).crawlJob.update({
        where: { id },
        data: { status: 'failed', errorMessage: runErr.message },
      })
      throw runErr
    }
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
