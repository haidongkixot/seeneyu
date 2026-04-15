/**
 * Cron: poll pending async video generation jobs.
 * Schedule: every 2 minutes (vercel.json)
 *
 * Handles: openai-sora, kling-video, replicate, runway, luma, higgsfield
 *
 * Flow: asset.status='generating' + metadata.pending=true + metadata.providerTaskId
 *   → poll provider → on complete: upload to Blob, mark ready, advance request to review
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query ALL generating assets — use Prisma JSON filter where possible
  const pendingAssets = await prisma.aiGeneratedAsset.findMany({
    where: { status: 'generating' },
    take: 50,
  })

  const toProcess = pendingAssets.filter(
    (a) => (a.metadata as any)?.pending && (a.metadata as any)?.providerTaskId,
  )

  // Debug: log what we found so we can diagnose stuck jobs
  console.log(`[video-poll] found ${pendingAssets.length} generating assets, ${toProcess.length} with pending+taskId`)
  if (pendingAssets.length > 0 && toProcess.length === 0) {
    console.log('[video-poll] generating assets without pending metadata:', pendingAssets.map(a => ({
      id: a.id, provider: a.provider, meta: JSON.stringify(a.metadata).slice(0, 150),
    })))
  }

  let completed = 0
  let still_pending = 0
  let failed = 0

  for (const asset of toProcess) {
    const meta = asset.metadata as any
    const taskId: string = meta.providerTaskId
    const provider: string = meta.provider ?? ''

    try {
      const result = await pollProvider(provider, taskId, meta)

      if (!result) {
        still_pending++
        continue
      }

      const pathname = `ai-content/${asset.requestId}/${asset.id}.mp4`
      const blob = await put(pathname, result.buffer, { access: 'public', contentType: 'video/mp4' })

      await prisma.aiGeneratedAsset.update({
        where: { id: asset.id },
        data: {
          status: 'ready',
          blobUrl: blob.url,
          durationMs: result.durationMs,
          metadata: { ...meta, pending: false },
        },
      })

      await prisma.aiContentRequest.updateMany({
        where: { id: asset.requestId, status: 'generating' },
        data: { status: 'review' },
      })

      completed++
    } catch (err: any) {
      console.error(`video-poll: asset ${asset.id} (${provider}) failed:`, err.message)
      await prisma.aiGeneratedAsset.update({
        where: { id: asset.id },
        data: { status: 'failed', errorMessage: err.message },
      }).catch(() => {})
      failed++
    }
  }

  return NextResponse.json({ completed, still_pending, failed, checked: toProcess.length, totalGenerating: pendingAssets.length })
}

async function pollProvider(
  provider: string,
  taskId: string,
  meta: any,
): Promise<{ buffer: Buffer; durationMs: number } | null> {
  switch (provider) {
    case 'openai-sora': {
      const { pollSoraJob } = await import('@/toolkit/ai-content-generator/services/sora-generator')
      return pollSoraJob(taskId)
    }

    case 'kling-video': {
      const { getKlingToken } = await import('@/toolkit/ai-content-generator/services/kling-auth')
      const apiKey = getKlingToken()
      const isI2V = meta.isI2V ?? false
      const pollEndpoint = isI2V
        ? `https://api.klingai.com/v1/videos/image2video/${taskId}`
        : `https://api.klingai.com/v1/videos/text2video/${taskId}`
      const res = await fetch(pollEndpoint, { headers: { Authorization: `Bearer ${apiKey}` } })
      if (!res.ok) return null
      const data = await res.json()
      const status = data.data?.task_status
      if (status === 'succeed') {
        const videoUrl = data.data?.task_result?.videos?.[0]?.url
        if (!videoUrl) throw new Error('Kling returned no video URL')
        const videoRes = await fetch(videoUrl)
        return { buffer: Buffer.from(await videoRes.arrayBuffer()), durationMs: 5000 }
      }
      if (status === 'failed') throw new Error(`Kling failed: ${data.data?.task_status_msg ?? 'unknown'}`)
      return null
    }

    case 'replicate': {
      const token = process.env.REPLICATE_API_TOKEN
      if (!token) throw new Error('REPLICATE_API_TOKEN not configured')
      const pollUrl = meta.pollUrl || `https://api.replicate.com/v1/predictions/${taskId}`
      const res = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return null
      const data = await res.json()
      if (data.status === 'succeeded') {
        const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output
        if (!outputUrl) throw new Error('No output URL from Replicate')
        const videoRes = await fetch(outputUrl)
        return { buffer: Buffer.from(await videoRes.arrayBuffer()), durationMs: 5000 }
      }
      if (data.status === 'failed') throw new Error(`Replicate failed: ${data.error}`)
      return null
    }

    case 'runway': {
      const apiKey = process.env.RUNWAY_API_KEY
      if (!apiKey) throw new Error('RUNWAY_API_KEY not configured')
      const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' },
      })
      if (!res.ok) return null
      const task = await res.json()
      if (task.status === 'SUCCEEDED') {
        const videoUrl = task.output?.[0]
        if (!videoUrl) throw new Error('No video URL from Runway')
        const videoRes = await fetch(videoUrl)
        return { buffer: Buffer.from(await videoRes.arrayBuffer()), durationMs: 5000 }
      }
      if (task.status === 'FAILED') throw new Error(`Runway failed: ${task.failure}`)
      return null
    }

    case 'luma': {
      const apiKey = process.env.LUMA_API_KEY
      if (!apiKey) throw new Error('LUMA_API_KEY not configured')
      const res = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data.state === 'completed') {
        const videoUrl = data.assets?.video
        if (!videoUrl) throw new Error('No video URL from Luma')
        const videoRes = await fetch(videoUrl)
        return { buffer: Buffer.from(await videoRes.arrayBuffer()), durationMs: 5000 }
      }
      if (data.state === 'failed') throw new Error(`Luma failed: ${data.failure_reason}`)
      return null
    }

    case 'higgsfield': {
      const { pollHiggsfieldJob } = await import('@/toolkit/ai-content-generator/services/higgsfield-generator')
      return pollHiggsfieldJob(taskId)
    }

    case 'google-veo': {
      const { pollVeoJob } = await import('@/toolkit/ai-content-generator/services/veo-generator')
      return pollVeoJob(taskId)
    }

    default:
      console.warn(`video-poll: unknown provider "${provider}", skipping`)
      return null
  }
}
