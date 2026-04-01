/**
 * Cron: poll pending async video generation jobs (e.g. Sora).
 * Schedule: every 2 minutes (vercel.json)
 *
 * Finds assets with status='generating' + metadata.pending=true,
 * polls the provider, and uploads to Vercel Blob when complete.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all assets still in 'generating' with a pending provider job
  const pendingAssets = await prisma.aiGeneratedAsset.findMany({
    where: { status: 'generating' },
    include: { request: { select: { id: true } } },
    take: 20,
  })

  const soraAssets = pendingAssets.filter(
    (a) => (a.metadata as any)?.pending && (a.metadata as any)?.providerTaskId,
  )

  let completed = 0
  let still_pending = 0
  let failed = 0

  for (const asset of soraAssets) {
    const meta = asset.metadata as any
    const jobId: string = meta.providerTaskId
    const provider: string = meta.provider ?? 'openai-sora'

    try {
      let result: { buffer: Buffer; durationMs: number } | null = null

      if (provider === 'openai-sora') {
        const { pollSoraJob } = await import('@/toolkit/ai-content-generator/services/sora-generator')
        result = await pollSoraJob(jobId)
      }

      if (!result) {
        still_pending++
        continue
      }

      // Upload to Vercel Blob
      const pathname = `ai-content/${asset.requestId}/${asset.id}.mp4`
      const blob = await put(pathname, result.buffer, {
        access: 'public',
        contentType: 'video/mp4',
      })

      await prisma.aiGeneratedAsset.update({
        where: { id: asset.id },
        data: {
          status: 'ready',
          blobUrl: blob.url,
          durationMs: result.durationMs,
          metadata: { ...meta, pending: false, blobUploadedAt: new Date().toISOString() },
        },
      })

      // Move request to review if not already
      await prisma.aiContentRequest.updateMany({
        where: { id: asset.requestId, status: 'generating' },
        data: { status: 'review' },
      })

      completed++
    } catch (err: any) {
      console.error(`video-poll: asset ${asset.id} failed:`, err.message)
      await prisma.aiGeneratedAsset.update({
        where: { id: asset.id },
        data: {
          status: 'failed',
          errorMessage: err.message,
        },
      }).catch(() => {})
      failed++
    }
  }

  return NextResponse.json({ completed, still_pending, failed, checked: soraAssets.length })
}
