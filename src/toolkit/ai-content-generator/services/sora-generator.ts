/**
 * OpenAI Sora video generator.
 * Uses the openai npm package (already installed).
 * DEPRECATED: Sora 2 shuts down September 24, 2026.
 * Env var: OPENAI_API_KEY (already configured)
 * Models: sora-2, sora-2-pro
 * Cost: $0.10-$0.50/second of video
 */

import OpenAI from 'openai'

export async function generateWithSora(
  prompt: string,
  model?: string,
): Promise<{ url: string; durationMs: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const openai = new OpenAI({ apiKey })
  const modelId = model ?? 'sora-2'

  // Submit video generation job
  const response = await (openai as any).videos.create({
    model: modelId,
    prompt,
    duration: 5, // 5 seconds default
    resolution: '720p',
    aspect_ratio: '16:9',
  })

  // Poll for completion
  let result = response
  let attempts = 0
  while (result.status === 'in_progress' && attempts < 120) {
    await new Promise(r => setTimeout(r, 5000))
    result = await (openai as any).videos.retrieve(result.id)
    attempts++
  }

  if (result.status !== 'succeeded') {
    throw new Error(`Sora generation failed: ${result.status} ${result.error ?? ''}`)
  }

  return {
    url: result.output_url ?? result.url,
    durationMs: (result.duration ?? 5) * 1000,
  }
}
