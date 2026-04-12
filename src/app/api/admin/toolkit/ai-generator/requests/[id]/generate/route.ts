import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateImage, uploadToBlob } from '@/toolkit/ai-content-generator'
import { generateVideo, uploadVideoToBlob } from '@/toolkit/ai-content-generator/services/video-generator'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const count = Math.min(body.count ?? 3, 5)
    const provider = body.provider
    const model = body.model
    const assetType: 'image' | 'video' = body.type === 'video' ? 'video' : 'image'
    const options = body.options ?? {}

    const request = await prisma.aiContentRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const selectedPrompt = assetType === 'video'
      ? request.videoPrompt ?? request.imagePrompt
      : request.imagePrompt

    if (!selectedPrompt) {
      return NextResponse.json({
        error: assetType === 'video'
          ? 'Video prompt is empty. Edit the request first.'
          : 'Image prompt is empty. Edit the request first.',
      }, { status: 400 })
    }

    const resolvedProvider = provider || request.provider
    const resolvedModel = model || request.model

    // Update request status to generating
    await prisma.aiContentRequest.update({
      where: { id },
      data: {
        status: 'generating',
        ...(provider ? { provider } : {}),
        ...(model ? { model } : {}),
      },
    })

    // Create placeholder asset records
    const assets = await Promise.all(
      Array.from({ length: count }, () =>
        prisma.aiGeneratedAsset.create({
          data: {
            requestId: id,
            type: assetType,
            provider: resolvedProvider,
            model: resolvedModel,
            prompt: selectedPrompt,
            status: 'generating',
          },
        }),
      ),
    )

    // Kick off generation — waitUntil keeps Vercel alive until the promise resolves
    if (assetType === 'video') {
      waitUntil(generateVideoAsync(assets.map((a) => a.id), selectedPrompt, resolvedProvider, resolvedModel, id, options)
        .catch(console.error))
    } else {
      waitUntil(generateAsync(assets.map((a) => a.id), selectedPrompt, resolvedProvider, resolvedModel, id, options)
        .catch(console.error))
    }

    return NextResponse.json({
      message: `Generating ${count} ${assetType}(s)`,
      assetIds: assets.map((a) => a.id),
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * Async image generation — generates images via the provider registry,
 * uploads to Vercel Blob, and updates asset records.
 */
async function generateAsync(
  assetIds: string[],
  prompt: string,
  provider: string,
  model: string | null,
  requestId: string,
  options?: Record<string, unknown>,
) {
  for (const assetId of assetIds) {
    try {
      // Generate the image via the toolkit service
      const result = await generateImage(prompt, provider, model || undefined, options as any)

      // Upload to Vercel Blob
      const blobUrl = await uploadToBlob(result.buffer, requestId, assetId, result.mimeType)

      await prisma.aiGeneratedAsset.update({
        where: { id: assetId },
        data: {
          status: 'ready',
          blobUrl,
          width: result.width,
          height: result.height,
          metadata: {
            provider,
            model,
            mimeType: result.mimeType,
            ...(result.metadata || {}),
          },
        },
      })
    } catch (err) {
      await prisma.aiGeneratedAsset.update({
        where: { id: assetId },
        data: {
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      }).catch(() => {})
    }
  }

  // After all assets are done, update request status
  const allAssets = await prisma.aiGeneratedAsset.findMany({ where: { requestId } })
  const anyReady = allAssets.some((a) => a.status === 'ready')
  await prisma.aiContentRequest.update({
    where: { id: requestId },
    data: { status: anyReady ? 'review' : 'failed' },
  })
}

/**
 * Async video generation — generates videos via the video generator service,
 * uploads to Vercel Blob, and updates asset records.
 */
async function generateVideoAsync(
  assetIds: string[],
  prompt: string,
  provider: string,
  model: string | null,
  requestId: string,
  options?: Record<string, unknown>,
) {
  for (const assetId of assetIds) {
    try {
      const result = await generateVideo(
        { prompt },
        provider,
        model || undefined,
        options as any,
      )

      if (!result) throw new Error(`${provider} returned no result (missing API key or unsupported input)`)

      // Async providers (e.g. Sora) return a pending sentinel with no buffer.
      // Store the provider job ID and leave status as 'generating' for the poll cron.
      if ((result.metadata as any)?.pending) {
        await prisma.aiGeneratedAsset.update({
          where: { id: assetId },
          data: {
            status: 'generating',
            metadata: {
              provider,
              model,
              mimeType: result.mimeType,
              hasAudio: (result.metadata as any)?.hasAudio ?? false,
              providerTaskId: (result.metadata as any)?.providerTaskId,
              pending: true,
            },
          },
        })
        continue
      }

      const blobUrl = await uploadVideoToBlob(result.buffer, requestId, assetId)

      await prisma.aiGeneratedAsset.update({
        where: { id: assetId },
        data: {
          status: 'ready',
          blobUrl,
          durationMs: result.durationMs,
          metadata: {
            provider,
            model,
            mimeType: result.mimeType,
            hasAudio: (result.metadata as any)?.hasAudio ?? false,
            ...(result.metadata || {}),
          },
        },
      })
    } catch (err) {
      await prisma.aiGeneratedAsset.update({
        where: { id: assetId },
        data: {
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      }).catch(() => {})
    }
  }

  // Update request status
  const allAssets = await prisma.aiGeneratedAsset.findMany({ where: { requestId } })
  const anyReady = allAssets.some((a) => a.status === 'ready')
  if (anyReady) {
    await prisma.aiContentRequest.update({
      where: { id: requestId },
      data: { status: 'review' },
    })
  }
}
