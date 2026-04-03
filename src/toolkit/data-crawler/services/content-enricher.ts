import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
}

export interface EnrichmentResult {
  keyInsights: string[]
  tags: string[]
  relevanceScore: number // 0-10
  relevanceReason: string
  summary: string
}

/**
 * Use GPT-4o to extract key insights, generate tags, and score relevance
 * of a ContentSource to body language training.
 */
export async function enrichContent(sourceId: string): Promise<EnrichmentResult> {
  const source = await prisma.contentSource.findUnique({ where: { id: sourceId } })
  if (!source) throw new Error(`ContentSource not found: ${sourceId}`)

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const contentPreview = (source.rawContent ?? source.title).slice(0, 3000)

  const prompt = `You are analyzing content for a body language and communication coaching platform called seeneyu.

Content type: ${source.type}
Title: ${source.title}
URL: ${source.url}
Content preview:
${contentPreview}

Analyze this content and return JSON with:
1. "keyInsights" — array of 3-5 key takeaways relevant to body language, facial expressions, or communication skills
2. "tags" — array of 5-10 descriptive tags (e.g., "eye-contact", "microexpressions", "power-posture", "vocal-tone")
3. "relevanceScore" — 0-10 score for how useful this is for training body language skills
4. "relevanceReason" — 1-2 sentence explanation of the score
5. "summary" — 2-3 sentence summary of the content

Return ONLY valid JSON.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content)

  const result: EnrichmentResult = {
    keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    relevanceScore: Math.max(0, Math.min(10, Number(parsed.relevanceScore) || 0)),
    relevanceReason: String(parsed.relevanceReason || ''),
    summary: String(parsed.summary || ''),
  }

  // Save enrichment results to metadata
  const existingMetadata = (source.metadata as Record<string, unknown>) ?? {}
  await prisma.contentSource.update({
    where: { id: sourceId },
    data: {
      metadata: {
        ...existingMetadata,
        enrichment: result as unknown as Record<string, string | number>,
        enrichedAt: new Date().toISOString(),
      } as any,
    },
  })

  return result
}

/**
 * Use GPT-4o Vision to auto-tag an expression image asset.
 * Analyzes the image and suggests labels, description, and tags.
 */
export async function autoTagExpressionAsset(assetId: string): Promise<{
  suggestedLabel: string
  suggestedTags: string[]
  description: string
  confidence: number
}> {
  const asset = await prisma.expressionAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error(`ExpressionAsset not found: ${assetId}`)

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this facial expression image for a body language coaching app.

Return JSON with:
1. "suggestedLabel" — primary emotion label (one of: anger, contempt, disgust, fear, happiness, sadness, surprise, neutral, confusion, interest, boredom, pride, shame, embarrassment)
2. "suggestedTags" — array of 3-8 descriptive tags about the expression details (e.g., "raised-eyebrows", "tight-lips", "wide-eyes", "asymmetric-smile")
3. "description" — 1-2 sentence description of what the expression conveys and how it's formed
4. "confidence" — 0.0-1.0 confidence score for the label

Return ONLY valid JSON.`,
          },
          {
            type: 'image_url',
            image_url: { url: asset.imageUrl },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 400,
    temperature: 0.2,
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content)

  const result = {
    suggestedLabel: String(parsed.suggestedLabel || asset.label),
    suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
    description: String(parsed.description || ''),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
  }

  // Update the asset with AI suggestions
  await prisma.expressionAsset.update({
    where: { id: assetId },
    data: {
      label: result.suggestedLabel,
      tags: result.suggestedTags,
      description: result.description,
      confidence: result.confidence,
    },
  })

  return result
}
