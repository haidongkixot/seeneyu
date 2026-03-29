import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { DescriptionOutput } from '../types'

// ── Skill Category Mapping ──────────────────────────────────────────

const EXPRESSION_TO_SKILL: Record<string, string> = {
  happiness: 'facial-expressions',
  happy: 'facial-expressions',
  sadness: 'facial-expressions',
  sad: 'facial-expressions',
  anger: 'facial-expressions',
  angry: 'facial-expressions',
  surprise: 'facial-expressions',
  surprised: 'facial-expressions',
  fear: 'facial-expressions',
  disgust: 'facial-expressions',
  contempt: 'micro-expressions',
  neutral: 'facial-expressions',
  confusion: 'facial-expressions',
  interest: 'active-listening',
  boredom: 'micro-expressions',
  pride: 'open-posture',
  shame: 'facial-expressions',
  embarrassment: 'facial-expressions',
}

const BODY_LANGUAGE_TO_SKILL: Record<string, string> = {
  open_posture: 'open-posture',
  closed_posture: 'open-posture',
  confident_stance: 'open-posture',
  submissive_gesture: 'open-posture',
  defensive_arms: 'open-posture',
  relaxed_lean: 'open-posture',
  power_pose: 'open-posture',
  nervous_fidget: 'active-listening',
  eye_contact: 'eye-contact',
  vocal_pacing: 'vocal-pacing',
}

type PublishTarget = 'library' | 'foundation' | 'arcade' | 'all'

/**
 * Convert a completed AiContentRequest into content across the platform:
 * - Clip in the Practice Library
 * - LessonExample in Foundation (auto-matched or new lesson)
 * - ArcadeChallenge in Arcade (creates or adds to matching bundle)
 */
export async function convertToClip(
  requestId: string,
  targets: PublishTarget = 'all'
): Promise<{ clipId: string; lessonExampleId?: string; challengeId?: string }> {
  const request = await prisma.aiContentRequest.findUnique({
    where: { id: requestId },
    include: {
      assets: {
        where: { status: 'ready' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!request) throw new Error(`AiContentRequest not found: ${requestId}`)

  const imageAsset = request.assets.find((a) => a.type === 'image')
  const videoAsset = request.assets.find((a) => a.type === 'video')
  const primaryAsset = videoAsset || imageAsset

  if (!primaryAsset || !primaryAsset.blobUrl) {
    throw new Error('No ready asset with blob URL found')
  }

  const desc = request.generatedDescription as DescriptionOutput | null
  const assetMeta = (primaryAsset.metadata as any) ?? {}

  // Composite assets (image + audio) from OpenAI should be treated as ai_image
  // since the blobUrl points to an image, not a playable video file
  const isComposite = assetMeta.isComposite === true
  const mediaType = (primaryAsset.type === 'video' && !isComposite) ? 'ai_video' : 'ai_image'
  const skillCategory =
    EXPRESSION_TO_SKILL[request.expressionType] ||
    BODY_LANGUAGE_TO_SKILL[request.bodyLanguageType] ||
    'eye-contact'

  const sceneDescription = desc?.sceneDescription
    ? `${desc.sceneDescription} ${desc.characterDescription || ''} ${desc.expressionDetails || ''}`.trim()
    : `AI-generated reference for ${request.expressionType} expression with ${request.bodyLanguageType.replace(/_/g, ' ')} body language.`

  const annotation = desc?.expressionDetails
    ? `${desc.expressionDetails}\n\n${desc.practiceInstructions || ''}`
    : request.imagePrompt || `${request.expressionType} / ${request.bodyLanguageType}`

  const observationGuide = await generateObservationGuide(
    request.expressionType,
    request.bodyLanguageType,
    desc,
  )

  const result: { clipId: string; lessonExampleId?: string; challengeId?: string } = {
    clipId: '',
  }

  // ── 1. Create Clip in Practice Library ────────────────────────────
  if (targets === 'library' || targets === 'all') {
    const clip = await prisma.clip.create({
      data: {
        youtubeVideoId: '',
        startSec: 0,
        endSec: 0,
        movieTitle: `AI Generated — ${request.expressionType}`,
        sceneDescription,
        skillCategory,
        difficulty: 'beginner',
        difficultyScore: 2,
        signalClarity: 9,
        noiseLevel: 1,
        contextDependency: 1,
        replicationDifficulty: 3,
        annotation,
        mediaType,
        mediaUrl: primaryAsset.blobUrl,
        aiContentRequestId: requestId,
        observationGuide: observationGuide as any ?? undefined,
        isActive: true,
      },
    })
    result.clipId = clip.id
  }

  // ── 2. Create Foundation LessonExample ────────────────────────────
  if (targets === 'foundation' || targets === 'all') {
    try {
      // Find a matching course by skill category
      const course = await (prisma as any).foundationCourse.findFirst({
        where: {
          OR: [
            { skillCategory },
            { title: { contains: request.expressionType, mode: 'insensitive' } },
            { title: { contains: request.bodyLanguageType.replace(/_/g, ' '), mode: 'insensitive' } },
          ],
        },
        include: { lessons: { orderBy: { order: 'desc' }, take: 1 } },
      })

      if (course && course.lessons.length > 0) {
        // Add as example to the latest lesson in matching course
        const lesson = course.lessons[0]
        const example = await (prisma as any).lessonExample.create({
          data: {
            lessonId: lesson.id,
            youtubeId: '',
            title: `${request.expressionType} — ${request.bodyLanguageType.replace(/_/g, ' ')}`,
            description: desc?.expressionDetails || sceneDescription,
            startTime: 0,
            mediaUrl: primaryAsset.blobUrl,
            mediaType,
          },
        })
        result.lessonExampleId = example.id
      } else {
        // No matching course — create example in the first available lesson
        const anyLesson = await (prisma as any).foundationLesson.findFirst({
          orderBy: { order: 'asc' },
        })
        if (anyLesson) {
          const example = await (prisma as any).lessonExample.create({
            data: {
              lessonId: anyLesson.id,
              youtubeId: '',
              title: `${request.expressionType} — ${request.bodyLanguageType.replace(/_/g, ' ')}`,
              description: desc?.expressionDetails || sceneDescription,
              startTime: 0,
              mediaUrl: primaryAsset.blobUrl,
              mediaType,
            },
          })
          result.lessonExampleId = example.id
        }
      }
    } catch (err) {
      console.error('Failed to create Foundation example:', err)
    }
  }

  // ── 3. Create Arcade Challenge ────────────────────────────────────
  if (targets === 'arcade' || targets === 'all') {
    try {
      // Find or create a bundle for AI-generated content
      let bundle = await (prisma as any).arcadeBundle.findFirst({
        where: { title: 'AI Expression Challenges' },
        include: { _count: { select: { challenges: true } } },
      })

      if (!bundle) {
        bundle = await (prisma as any).arcadeBundle.create({
          data: {
            title: 'AI Expression Challenges',
            description: 'Practice facial expressions and body language with AI-generated reference images. Master the art of non-verbal communication.',
            theme: 'AI Generated',
            difficulty: 'beginner',
            xpReward: 50,
          },
        })
        bundle._count = { challenges: 0 }
      }

      const challengeType = request.expressionType.includes('vocal') || request.bodyLanguageType.includes('vocal')
        ? 'vocal'
        : 'facial'

      const challenge = await (prisma as any).arcadeChallenge.create({
        data: {
          bundleId: bundle.id,
          type: challengeType,
          title: `${capitalize(request.expressionType)} — ${capitalize(request.bodyLanguageType.replace(/_/g, ' '))}`,
          description: desc?.practiceInstructions || `Replicate the ${request.expressionType} expression with ${request.bodyLanguageType.replace(/_/g, ' ')}.`,
          context: desc?.sceneDescription || sceneDescription,
          difficulty: 'beginner',
          xpReward: 20,
          orderIndex: (bundle._count?.challenges ?? 0) + 1,
          mediaUrl: primaryAsset.blobUrl,
          mediaType,
        },
      })
      result.challengeId = challenge.id
    } catch (err) {
      console.error('Failed to create Arcade challenge:', err)
    }
  }

  // ── Update request status ─────────────────────────────────────────
  await prisma.aiContentRequest.update({
    where: { id: requestId },
    data: {
      status: 'published',
      publishedClipId: result.clipId || null,
    },
  })

  return result
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Observation Guide Generator ─────────────────────────────────────

async function generateObservationGuide(
  expressionType: string,
  bodyLanguageType: string,
  description: DescriptionOutput | null,
): Promise<Record<string, unknown> | null> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      focusAreas: [
        { area: 'Facial Expression', description: `Observe the ${expressionType} expression` },
        { area: 'Body Language', description: `Notice the ${bodyLanguageType.replace(/_/g, ' ')}` },
      ],
      keySignals: [`${expressionType} emotion`, bodyLanguageType.replace(/_/g, ' ')],
      commonMistakes: ['Overexaggerating the expression', 'Forgetting body posture'],
    }
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const context = description
    ? `Expression details: ${description.expressionDetails}\nPractice instructions: ${description.practiceInstructions}`
    : ''

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Create an observation guide for a body language training exercise.

Expression: ${expressionType}
Body Language: ${bodyLanguageType.replace(/_/g, ' ')}
${context}

Return JSON:
{
  "focusAreas": [{ "area": "string", "description": "string", "timingHint": "string" }],
  "keySignals": ["specific signals to look for"],
  "commonMistakes": ["what learners often do wrong"],
  "progressionTips": "how to improve"
}

Return ONLY valid JSON.`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.5,
    })

    return JSON.parse(response.choices[0]?.message?.content ?? '{}')
  } catch (err) {
    console.error('Failed to generate observation guide:', err)
    return null
  }
}
