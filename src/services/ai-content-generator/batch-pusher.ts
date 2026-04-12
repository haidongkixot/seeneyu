import { waitUntil } from '@vercel/functions'
import { prisma } from '@/lib/prisma'
import { generateVideo, uploadVideoToBlob } from '@/toolkit/ai-content-generator/services/video-generator'

// ── Skill Category → Expression Type mapping ───────────────────────

const SKILL_TO_EXPRESSION: Record<string, string> = {
  'eye-contact': 'neutral',
  'facial-expressions': 'happiness',
  'open-posture': 'confidence',
  'active-listening': 'interest',
  'vocal-pacing': 'neutral',
  'confident-disagreement': 'neutral',
}

// ── Bounded concurrency pool ───────────────────────────────────────

async function withConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let running = 0
  let idx = 0
  return new Promise((resolve) => {
    function next() {
      while (running < concurrency && idx < items.length) {
        running++
        const i = idx++
        fn(items[i])
          .catch((e) => console.error('Batch item failed:', e))
          .finally(() => {
            running--
            next()
          })
      }
      if (running === 0 && idx >= items.length) resolve()
    }
    next()
  })
}

// ── Generate video for a single request ────────────────────────────

async function dispatchVideoGeneration(
  requestId: string,
  videoPrompt: string,
  provider: string,
  model: string | null,
  options: Record<string, unknown>,
) {
  // Create one AiGeneratedAsset for the video
  const asset = await (prisma as any).aiGeneratedAsset.create({
    data: {
      requestId,
      type: 'video',
      provider,
      model,
      prompt: videoPrompt,
      status: 'generating',
    },
  })

  // Update request status to generating
  await (prisma as any).aiContentRequest.update({
    where: { id: requestId },
    data: { status: 'generating' },
  })

  try {
    const result = await generateVideo(
      { prompt: videoPrompt },
      provider,
      model || undefined,
      options as any,
    )

    if (!result) {
      throw new Error(`${provider} returned no result (missing API key or unsupported input)`)
    }

    // Async providers return a pending sentinel with providerTaskId
    if ((result.metadata as any)?.pending) {
      await (prisma as any).aiGeneratedAsset.update({
        where: { id: asset.id },
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
      // Leave request in 'generating' — cron poll will complete it
      return
    }

    // Synchronous provider — upload immediately
    const blobUrl = await uploadVideoToBlob(result.buffer, requestId, asset.id)

    await (prisma as any).aiGeneratedAsset.update({
      where: { id: asset.id },
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

    // Asset ready — mark request as review
    await (prisma as any).aiContentRequest.update({
      where: { id: requestId },
      data: { status: 'review' },
    })
  } catch (err) {
    await (prisma as any).aiGeneratedAsset.update({
      where: { id: asset.id },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      },
    }).catch(() => {})

    await (prisma as any).aiContentRequest.update({
      where: { id: requestId },
      data: { status: 'failed' },
    }).catch(() => {})
  }
}

// ── Main export ────────────────────────────────────────────────────

export async function pushBatchToGenerator(params: {
  batchId: string
  provider: string
  model: string | null
  options: { duration?: number; aspectRatio?: string; resolution?: string }
  concurrency: number
  createdBy: string
}): Promise<{ requestIds: string[]; count: number }> {
  const { batchId, provider, model, options, concurrency, createdBy } = params

  // Load the batch
  const batch = await (prisma as any).practiceIdeaBatch.findUnique({
    where: { id: batchId },
  })

  if (!batch) throw new Error('Batch not found')
  if (batch.status !== 'complete') throw new Error('Batch is not complete')

  const ideas = batch.ideas as any[]
  if (!ideas || ideas.length === 0) throw new Error('Batch has no ideas')

  // Create all AiContentRequests in a single transaction
  const requests = await (prisma as any).$transaction(
    ideas.map((idea: any) => {
      const skillCategory: string = idea.skillCategory || 'eye-contact'
      const expressionType = SKILL_TO_EXPRESSION[skillCategory] || 'neutral'
      const bodyLanguageType = skillCategory.replace(/-/g, '_')
      const scenePrompt = [idea.characterDescription, idea.sceneDescription]
        .filter(Boolean)
        .join('\n')
      const videoPrompt: string = idea.mainVideo?.prompt || ''

      return (prisma as any).aiContentRequest.create({
        data: {
          expressionType,
          bodyLanguageType,
          scenePrompt: scenePrompt || null,
          imagePrompt: null,
          videoPrompt: videoPrompt || null,
          provider,
          model,
          status: 'draft',
          createdBy,
          collectionId: batchId,
          sourcePracticeIdeaId: idea.id || null,
          collectionTitle: idea.title || null,
        },
      })
    }),
  )

  const requestIds: string[] = requests.map((r: any) => r.id)

  // Dispatch video generation with bounded concurrency using waitUntil
  // so the HTTP handler returns fast
  const generationItems = requests.map((r: any, i: number) => ({
    requestId: r.id,
    videoPrompt: (ideas[i].mainVideo?.prompt as string) || '',
  }))

  waitUntil(
    withConcurrency(generationItems, concurrency, async (item: { requestId: string; videoPrompt: string }) => {
      if (!item.videoPrompt) {
        // No prompt — mark as failed immediately
        await (prisma as any).aiContentRequest.update({
          where: { id: item.requestId },
          data: { status: 'failed' },
        })
        return
      }
      await dispatchVideoGeneration(
        item.requestId,
        item.videoPrompt,
        provider,
        model,
        options as Record<string, unknown>,
      )
    }).catch((err) => console.error('Batch generation pool error:', err)),
  )

  return { requestIds, count: requestIds.length }
}
