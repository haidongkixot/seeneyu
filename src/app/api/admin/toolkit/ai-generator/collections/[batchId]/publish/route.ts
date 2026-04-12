import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/**
 * POST — Publish all review-ready practice ideas in a collection.
 * Creates Clip + PracticeSteps + ObservationGuide + Tags for each idea
 * using the full practice data stored in generatedDescription.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    await requireAdmin()
    const { batchId } = await params

    const requests = await (prisma as any).aiContentRequest.findMany({
      where: { collectionId: batchId, status: 'review' },
      include: { assets: true },
    })

    if (requests.length === 0) {
      return NextResponse.json({ error: 'No requests in review status' }, { status: 400 })
    }

    let published = 0
    let failed = 0
    const errors: string[] = []

    for (const request of requests) {
      try {
        const idea = request.generatedDescription as any
        if (!idea) {
          errors.push(`${request.collectionTitle}: no practice idea data`)
          failed++
          continue
        }

        const assets = (request.assets || []) as any[]
        const mainAsset = assets.find((a: any) => a.metadata?.role === 'main' && a.status === 'ready')

        if (!mainAsset || !mainAsset.blobUrl) {
          errors.push(`${request.collectionTitle}: main video not ready`)
          failed++
          continue
        }

        const clip = await (prisma as any).clip.create({
          data: {
            youtubeVideoId: `ai-${request.id.slice(0, 8)}`,
            startSec: 0,
            endSec: idea.estimatedDurationSec || 15,
            movieTitle: String(idea.title || request.collectionTitle || 'AI Practice'),
            year: new Date().getFullYear(),
            characterName: String(idea.characterName || ''),
            actorName: null,
            sceneDescription: String(idea.sceneDescription || ''),
            skillCategory: String(idea.skillCategory || request.bodyLanguageType?.replace(/_/g, '-') || 'eye-contact'),
            difficulty: String(idea.difficulty || 'beginner'),
            difficultyScore: 8,
            signalClarity: 2,
            noiseLevel: 2,
            contextDependency: 2,
            replicationDifficulty: 2,
            annotation: String(idea.annotation || ''),
            mediaType: 'ai_video',
            mediaUrl: mainAsset.blobUrl,
            aiContentRequestId: request.id,
            isActive: true,
            observationGuide: idea.observationGuide || null,
          },
        })

        // Create PracticeStep records — use step video blobUrl as demoImageUrl
        const ideaSteps: any[] = Array.isArray(idea.practiceSteps) ? idea.practiceSteps : []
        const stepAssets = assets
          .filter((a: any) => a.metadata?.role === 'step' && a.status === 'ready')
          .sort((a: any, b: any) => (a.metadata?.stepNumber || 0) - (b.metadata?.stepNumber || 0))

        for (const step of ideaSteps) {
          const matchingAsset = stepAssets.find((a: any) => a.metadata?.stepNumber === step.stepNumber)
          await (prisma as any).practiceStep.create({
            data: {
              clipId: clip.id,
              stepNumber: Number(step.stepNumber) || 0,
              skillFocus: String(step.skillFocus || ''),
              instruction: String(step.instruction || ''),
              tip: String(step.tip || ''),
              targetDurationSec: Number(step.targetDurationSec) || 20,
              demoImageUrl: matchingAsset?.blobUrl || null,
            },
          })
        }

        // Auto-tag
        const tags: { category: string; value: string }[] = [
          { category: 'genre', value: 'ai-generated' },
        ]
        if (idea.filmingStyle === 'pixar-3d') tags.push({ category: 'genre', value: 'animation' })
        for (const tag of tags) {
          await (prisma as any).clipTag.upsert({
            where: { clipId_category_value: { clipId: clip.id, category: tag.category, value: tag.value } },
            update: {},
            create: { clipId: clip.id, category: tag.category, value: tag.value, source: 'ai-auto', confidence: 1.0 },
          }).catch(() => {})
        }

        await (prisma as any).aiContentRequest.update({
          where: { id: request.id },
          data: { status: 'published', publishedClipId: clip.id },
        })
        published++
      } catch (err: any) {
        errors.push(`${request.collectionTitle}: ${err.message}`)
        failed++
      }
    }

    return NextResponse.json({ published, failed, errors })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
