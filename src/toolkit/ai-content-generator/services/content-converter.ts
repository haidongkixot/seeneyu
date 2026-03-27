import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { DescriptionOutput } from '../types'

// ── Skill Category Mapping ──────────────────────────────────────────

const EXPRESSION_TO_SKILL: Record<string, string> = {
  happiness: 'facial-expressions',
  sadness: 'facial-expressions',
  anger: 'facial-expressions',
  surprise: 'facial-expressions',
  fear: 'facial-expressions',
  disgust: 'facial-expressions',
  contempt: 'micro-expressions',
  neutral: 'facial-expressions',
  confusion: 'facial-expressions',
  interest: 'active-listening',
  boredom: 'micro-expressions',
  pride: 'posture',
  shame: 'facial-expressions',
  embarrassment: 'facial-expressions',
}

/**
 * Convert a completed AiContentRequest (with ready assets) into a Clip record.
 *
 * - Maps expressionType to skillCategory
 * - Auto-populates sceneDescription, annotation, difficulty, mediaUrl, mediaType
 * - Sets isActive=false (admin must review and activate)
 * - Generates observationGuide via GPT-4o-mini
 */
export async function convertToClip(requestId: string): Promise<{ clipId: string }> {
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

  // Pick the best ready asset (prefer image, then video)
  const imageAsset = request.assets.find((a) => a.type === 'image')
  const videoAsset = request.assets.find((a) => a.type === 'video')
  const primaryAsset = imageAsset || videoAsset

  if (!primaryAsset || !primaryAsset.blobUrl) {
    throw new Error('No ready asset with blob URL found')
  }

  // Parse the generated description if available
  const desc = request.generatedDescription as DescriptionOutput | null

  // Determine media type
  const mediaType = primaryAsset.type === 'video' ? 'ai_video' : 'ai_image'

  // Map expression to skill category, fallback to bodyLanguageType
  const skillCategory = EXPRESSION_TO_SKILL[request.expressionType] || request.bodyLanguageType

  // Build scene description from generated description or fallback
  const sceneDescription = desc?.sceneDescription
    ? `${desc.sceneDescription} ${desc.characterDescription || ''} ${desc.expressionDetails || ''}`.trim()
    : `AI-generated reference for ${request.expressionType} expression with ${request.bodyLanguageType.replace(/-/g, ' ')} body language.`

  // Build annotation
  const annotation = desc?.expressionDetails
    ? `${desc.expressionDetails}\n\n${desc.practiceInstructions || ''}`
    : request.imagePrompt || `${request.expressionType} / ${request.bodyLanguageType}`

  // Generate observation guide via GPT-4o-mini
  const observationGuide = await generateObservationGuide(
    request.expressionType,
    request.bodyLanguageType,
    desc,
  )

  // Create the Clip
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
      isActive: false, // Admin must activate
    },
  })

  // Update the request with published clip ID
  await prisma.aiContentRequest.update({
    where: { id: requestId },
    data: {
      status: 'published',
      publishedClipId: clip.id,
    },
  })

  return { clipId: clip.id }
}

// ── Observation Guide Generator ─────────────────────────────────────

async function generateObservationGuide(
  expressionType: string,
  bodyLanguageType: string,
  description: DescriptionOutput | null,
): Promise<Record<string, unknown> | null> {
  if (!process.env.OPENAI_API_KEY) {
    // Return a basic guide without AI
    return {
      focusAreas: [
        { area: 'Facial Expression', description: `Observe the ${expressionType} expression` },
        { area: 'Body Language', description: `Notice the ${bodyLanguageType.replace(/-/g, ' ')}` },
      ],
      keySignals: [`${expressionType} emotion`, bodyLanguageType.replace(/-/g, ' ')],
      commonMistakes: ['Overexaggerating the expression', 'Forgetting body posture'],
    }
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const context = description
    ? `Expression details: ${description.expressionDetails}\nPractice instructions: ${description.practiceInstructions}`
    : ''

  const prompt = `Create an observation guide for a body language training exercise.

Expression: ${expressionType}
Body Language: ${bodyLanguageType.replace(/-/g, ' ')}
${context}

Return a JSON object:
{
  "focusAreas": [{ "area": "string", "description": "string", "timingHint": "string" }],
  "keySignals": ["string array of specific signals to look for"],
  "commonMistakes": ["string array of what learners often do wrong"],
  "progressionTips": "string with 1-2 sentences on how to improve"
}

Return ONLY valid JSON.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    return JSON.parse(content)
  } catch (err) {
    console.error('Failed to generate observation guide:', err)
    return null
  }
}
