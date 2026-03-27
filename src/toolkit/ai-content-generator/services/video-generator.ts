import { put } from '@vercel/blob'
import type { GenerationResult } from '../types'

/**
 * Generate a video from an image URL using image-to-video models.
 * Currently supports Hugging Face stable-video-diffusion if HF_TOKEN is set.
 *
 * Returns null gracefully if no video provider is available.
 */
export async function generateVideo(
  imageUrl: string,
  provider?: string,
  model?: string,
): Promise<GenerationResult | null> {
  const resolvedProvider = provider || 'huggingface-video'

  switch (resolvedProvider) {
    case 'huggingface-video':
      return generateWithHFVideo(imageUrl, model)
    default:
      console.warn(`No video generation handler for provider: ${resolvedProvider}`)
      return null
  }
}

/**
 * Upload a generated video buffer to Vercel Blob.
 * Returns the public blob URL.
 */
export async function uploadVideoToBlob(
  buffer: Buffer,
  requestId: string,
  assetId: string,
): Promise<string> {
  const pathname = `ai-content/${requestId}/${assetId}.mp4`
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: 'video/mp4',
  })
  return blob.url
}

// ── Hugging Face Stable Video Diffusion ─────────────────────────────

async function generateWithHFVideo(
  imageUrl: string,
  model?: string,
): Promise<GenerationResult | null> {
  const token = process.env.HF_TOKEN
  if (!token) {
    console.warn('HF_TOKEN not set — skipping video generation')
    return null
  }

  const resolvedModel = model || 'stabilityai/stable-video-diffusion-img2vid-xt'

  try {
    // Fetch the source image as a blob
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch source image: ${imageRes.status}`)
    }
    const imageBlob = await imageRes.blob()

    const res = await fetch(`https://api-inference.huggingface.co/models/${resolvedModel}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: imageBlob,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      // If model is loading/unavailable, return null gracefully
      if (res.status === 503 || res.status === 429) {
        console.warn(`HF video model unavailable (${res.status}): ${text.slice(0, 100)}`)
        return null
      }
      throw new Error(`HF video failed (${res.status}): ${text.slice(0, 200)}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return {
      buffer,
      mimeType: 'video/mp4',
      durationMs: 4000, // SVD generates ~4s clips
      metadata: { model: resolvedModel },
    }
  } catch (err) {
    console.error('Video generation failed:', err)
    return null
  }
}
