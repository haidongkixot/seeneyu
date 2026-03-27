import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateImage, uploadToBlob } from '@/toolkit/ai-content-generator'

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

    const request = await prisma.aiContentRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (!request.imagePrompt) {
      return NextResponse.json({ error: 'Image prompt is empty. Edit the request first.' }, { status: 400 })
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
            type: 'image',
            provider: resolvedProvider,
            model: resolvedModel,
            prompt: request.imagePrompt!,
            status: 'generating',
          },
        }),
      ),
    )

    // Kick off generation asynchronously (non-blocking)
    generateAsync(assets.map((a) => a.id), request.imagePrompt!, resolvedProvider, resolvedModel, id)
      .catch(console.error)

    return NextResponse.json({
      message: `Generating ${count} images`,
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
) {
  for (const assetId of assetIds) {
    try {
      // Generate the image via the toolkit service
      const result = await generateImage(prompt, provider, model || undefined)

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
