import OpenAI from 'openai'
import type { DescriptionOutput } from '../types'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
}

/**
 * Use GPT-4o-mini to generate a structured description for an AI content
 * request, including scene description, character details, expression
 * specifics, image/video prompts, and practice instructions.
 *
 * Follows the pattern from src/toolkit/data-crawler/services/content-enricher.ts
 */
export async function generateDescription(
  expressionType: string,
  bodyLanguageType: string,
  scenePrompt?: string,
): Promise<DescriptionOutput> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const prompt = `You are an expert body language and facial expression coach for a training platform called seeneyu.

Create a detailed description for an AI-generated reference image/video showing:
- Expression: ${expressionType}
- Body Language: ${bodyLanguageType.replace(/-/g, ' ')}
${scenePrompt ? `- Scene Context: ${scenePrompt}` : '- Scene Context: Professional setting, neutral background'}

Return a JSON object with these fields:
1. "sceneDescription" — 2-3 sentences describing the full scene setting, lighting, and mood
2. "characterDescription" — 2-3 sentences describing the person's overall appearance, posture, and body positioning
3. "expressionDetails" — 2-3 sentences with specific details about the facial expression (muscle movements, eye position, mouth shape, etc.)
4. "imagePrompt" — A detailed, optimized prompt for AI image generation. Include: subject, expression details, body language, camera angle, lighting, style (photorealistic), and quality modifiers. 100-150 words.
5. "videoPrompt" — A detailed prompt for AI video generation from the image. Describe subtle movements: slight head turn, blinking, breathing, micro-expression shifts. 50-80 words.
6. "practiceInstructions" — 3-5 step-by-step instructions for a learner to replicate this expression and body language. Be specific about muscle movements.

Return ONLY valid JSON.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 1200,
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content)

  return {
    sceneDescription: String(parsed.sceneDescription || ''),
    characterDescription: String(parsed.characterDescription || ''),
    expressionDetails: String(parsed.expressionDetails || ''),
    imagePrompt: String(parsed.imagePrompt || ''),
    videoPrompt: String(parsed.videoPrompt || ''),
    practiceInstructions: String(parsed.practiceInstructions || ''),
  }
}
