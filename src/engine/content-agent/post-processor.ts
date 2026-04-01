import { prisma } from '@/lib/prisma'
import { generateImage } from '@/toolkit/ai-content-generator/services/image-generator'
import { generateVideo } from '@/toolkit/ai-content-generator/services/video-generator'
import { convertToClip } from '@/toolkit/ai-content-generator/services/content-converter'
import { put } from '@vercel/blob'

export async function processCompletedJobs(): Promise<{ processed: number; published: number }> {
  // Find queued jobs ready for generation
  const queuedJobs = await prisma.agentGenerationJob.findMany({
    where: { status: 'queued' },
    include: { suggestion: true },
    take: 5, // Process 5 at a time to stay within serverless limits
  })

  let processed = 0
  let published = 0

  for (const job of queuedJobs) {
    try {
      await prisma.agentGenerationJob.update({
        where: { id: job.id },
        data: { status: 'generating', startedAt: new Date() },
      })

      // Get the content request for prompts
      const contentRequest = job.contentRequestId
        ? await prisma.aiContentRequest.findUnique({ where: { id: job.contentRequestId } })
        : null

      const prompt = job.suggestion.mediaType === 'video'
        ? (contentRequest?.videoPrompt ?? `Person demonstrating ${job.suggestion.bodyLanguageType}`)
        : (contentRequest?.imagePrompt ?? `${job.suggestion.expressionType} expression, professional photography`)

      let result: any = null
      if (job.suggestion.mediaType === 'video') {
        result = await generateVideo({ prompt }, job.provider, job.model ?? undefined)
      } else {
        result = await generateImage(prompt, job.provider, job.model ?? undefined)
      }

      if (!result?.buffer && !result?.url) {
        throw new Error('Generation returned no result')
      }

      // Upload to Vercel Blob
      let blobUrl = result.url
      if (result.buffer) {
        const ext = job.suggestion.mediaType === 'video' ? 'mp4' : 'png'
        const mime = job.suggestion.mediaType === 'video' ? 'video/mp4' : 'image/png'
        const blob = await put(`ai-content/agent/${job.id}.${ext}`, result.buffer, {
          access: 'public',
          contentType: mime,
        })
        blobUrl = blob.url
      }

      // Create AiGeneratedAsset
      await prisma.aiGeneratedAsset.create({
        data: {
          requestId: job.contentRequestId ?? '',
          type: job.suggestion.mediaType,
          provider: job.provider,
          model: job.model,
          prompt,
          blobUrl,
          status: 'ready',
        },
      })

      // Update job
      await prisma.agentGenerationJob.update({
        where: { id: job.id },
        data: { status: 'completed', blobUrl, completedAt: new Date() },
      })

      // If "for_public", publish to platform
      if (job.suggestion.classification === 'for_public' && job.contentRequestId) {
        try {
          const publishTargets = (job.suggestion.publishTargets as string[]) ?? ['library']
          const target = publishTargets.includes('library') ? 'all' : 'library'
          await convertToClip(job.contentRequestId, target as any)
          await prisma.aiContentRequest.update({
            where: { id: job.contentRequestId },
            data: { status: 'published' },
          })
          published++
        } catch (pubError) {
          console.error(`Failed to publish content for job ${job.id}:`, pubError)
        }
      }

      // Update suggestion status
      await prisma.contentSuggestion.update({
        where: { id: job.suggestion.id },
        data: { status: 'completed' },
      })

      processed++
    } catch (error) {
      const retryCount = job.retryCount + 1
      await prisma.agentGenerationJob.update({
        where: { id: job.id },
        data: {
          status: retryCount >= 3 ? 'failed' : 'queued',
          retryCount,
          errorMessage: String(error),
        },
      })

      if (retryCount >= 3) {
        await prisma.contentSuggestion.update({
          where: { id: job.suggestion.id },
          data: { status: 'failed' },
        })
      }
    }
  }

  // Check if all jobs for any cycle are done
  const activeCycles = await prisma.contentAgentCycle.findMany({
    where: { status: 'generating' },
    select: { id: true },
  })

  for (const cycle of activeCycles) {
    const pendingJobs = await prisma.agentGenerationJob.count({
      where: {
        suggestion: { cycleId: cycle.id },
        status: { in: ['queued', 'generating', 'uploading'] },
      },
    })
    if (pendingJobs === 0) {
      const completedJobs = await prisma.agentGenerationJob.count({
        where: { suggestion: { cycleId: cycle.id }, status: 'completed' },
      })
      await prisma.contentAgentCycle.update({
        where: { id: cycle.id },
        data: { status: 'completed', generatedCount: completedJobs, completedAt: new Date() },
      })
    }
  }

  return { processed, published }
}
