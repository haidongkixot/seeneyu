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
          .finally(() => { running--; next() })
      }
      if (running === 0 && idx >= items.length) resolve()
    }
    next()
  })
}

// ── Generate a single video asset ─────────────────────────────────

async function generateSingleAsset(
  assetId: string,
  requestId: string,
  prompt: string,
  provider: string,
  model: string | null,
  options: Record<string, unknown>,
) {
  try {
    const result = await generateVideo(
      { prompt },
      provider,
      model || undefined,
      options as any,
    )

    if (!result) throw new Error(`${provider} returned no result`)

    if ((result.metadata as any)?.pending) {
      await (prisma as any).aiGeneratedAsset.update({
        where: { id: assetId },
        data: {
          status: 'generating',
          metadata: {
            provider, model,
            mimeType: result.mimeType,
            hasAudio: (result.metadata as any)?.hasAudio ?? false,
            providerTaskId: (result.metadata as any)?.providerTaskId,
            pending: true,
          },
        },
      })
      return
    }

    const blobUrl = await uploadVideoToBlob(result.buffer, requestId, assetId)
    await (prisma as any).aiGeneratedAsset.update({
      where: { id: assetId },
      data: {
        status: 'ready',
        blobUrl,
        durationMs: result.durationMs,
        metadata: {
          provider, model,
          mimeType: result.mimeType,
          hasAudio: (result.metadata as any)?.hasAudio ?? false,
          ...(result.metadata || {}),
        },
      },
    })
  } catch (err) {
    await (prisma as any).aiGeneratedAsset.update({
      where: { id: assetId },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      },
    }).catch(() => {})
  }
}

// ── Update request status based on its assets ─────────────────────

async function refreshRequestStatus(requestId: string) {
  const assets = await (prisma as any).aiGeneratedAsset.findMany({
    where: { requestId },
    select: { status: true },
  })
  const allDone = assets.every((a: any) => a.status === 'ready' || a.status === 'failed')
  const anyReady = assets.some((a: any) => a.status === 'ready')
  const allFailed = assets.every((a: any) => a.status === 'failed')

  if (allDone) {
    await (prisma as any).aiContentRequest.update({
      where: { id: requestId },
      data: { status: allFailed ? 'failed' : 'review' },
    })
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

  const batch = await (prisma as any).practiceIdeaBatch.findUnique({
    where: { id: batchId },
  })
  if (!batch) throw new Error('Batch not found')
  if (batch.status !== 'complete') throw new Error('Batch is not complete')

  const ideas = batch.ideas as any[]
  if (!ideas || ideas.length === 0) throw new Error('Batch has no ideas')

  // For each practice idea, create 1 AiContentRequest with MULTIPLE assets:
  //   - 1 main video asset (15s)
  //   - N step video assets (5s each)
  // Store the FULL practice idea in generatedDescription for publish
  const requestIds: string[] = []
  const allAssetJobs: { assetId: string; requestId: string; prompt: string; durationSec: number }[] = []

  for (const idea of ideas) {
    const skillCategory: string = idea.skillCategory || 'eye-contact'
    const expressionType = SKILL_TO_EXPRESSION[skillCategory] || 'neutral'
    const bodyLanguageType = skillCategory.replace(/-/g, '_')
    const scenePrompt = [idea.characterDescription, idea.sceneDescription].filter(Boolean).join('\n')
    const mainPrompt: string = idea.mainVideo?.prompt || ''
    const steps: any[] = Array.isArray(idea.practiceSteps) ? idea.practiceSteps : []

    // Create the request with the full idea stored in generatedDescription
    const request = await (prisma as any).aiContentRequest.create({
      data: {
        expressionType,
        bodyLanguageType,
        scenePrompt: scenePrompt || null,
        imagePrompt: null,
        videoPrompt: mainPrompt || null,
        generatedDescription: idea,
        provider,
        model,
        status: 'draft',
        createdBy,
        collectionId: batchId,
        sourcePracticeIdeaId: idea.id || null,
        collectionTitle: idea.title || null,
      },
    })
    requestIds.push(request.id)

    // Create asset for the MAIN VIDEO (15s)
    if (mainPrompt) {
      const mainAsset = await (prisma as any).aiGeneratedAsset.create({
        data: {
          requestId: request.id,
          type: 'video',
          provider,
          model,
          prompt: mainPrompt,
          status: 'generating',
          metadata: {
            role: 'main',
            durationSec: 15,
            ideaTitle: idea.title,
          },
        },
      })
      allAssetJobs.push({
        assetId: mainAsset.id,
        requestId: request.id,
        prompt: mainPrompt,
        durationSec: 15,
      })
    }

    // Create assets for each STEP VIDEO (5s)
    for (const step of steps) {
      const stepPrompt: string = step.videoPrompt || ''
      if (!stepPrompt) continue

      const stepAsset = await (prisma as any).aiGeneratedAsset.create({
        data: {
          requestId: request.id,
          type: 'video',
          provider,
          model,
          prompt: stepPrompt,
          status: 'generating',
          metadata: {
            role: 'step',
            stepNumber: step.stepNumber || 0,
            skillFocus: step.skillFocus || '',
            durationSec: 5,
            ideaTitle: idea.title,
          },
        },
      })
      allAssetJobs.push({
        assetId: stepAsset.id,
        requestId: request.id,
        prompt: stepPrompt,
        durationSec: 5,
      })
    }

    // Mark request as generating
    await (prisma as any).aiContentRequest.update({
      where: { id: request.id },
      data: { status: 'generating' },
    })
  }

  // Dispatch ALL asset generations with bounded concurrency via waitUntil
  waitUntil(
    withConcurrency(allAssetJobs, concurrency, async (job) => {
      const jobOptions = { ...options, duration: job.durationSec }
      await generateSingleAsset(
        job.assetId,
        job.requestId,
        job.prompt,
        provider,
        model,
        jobOptions as Record<string, unknown>,
      )
      // After each asset completes, check if all assets for this request are done
      await refreshRequestStatus(job.requestId)
    }).catch((err) => console.error('Batch generation pool error:', err)),
  )

  return { requestIds, count: requestIds.length }
}
