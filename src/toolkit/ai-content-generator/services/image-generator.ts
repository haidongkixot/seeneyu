import OpenAI from 'openai'
import { put } from '@vercel/blob'
import { getProviderConfig } from './provider-registry'
import type { GenerationResult, GenerationOptions } from '../types'

// ── Main dispatcher ─────────────────────────────────────────────────

/**
 * Generate an image using the specified provider and model.
 * Returns a Buffer + metadata. Caller is responsible for uploading
 * to Vercel Blob (see `uploadToBlob`).
 */
export async function generateImage(
  prompt: string,
  provider: string,
  model?: string,
  options?: GenerationOptions,
): Promise<GenerationResult> {
  const config = getProviderConfig(provider)
  if (!config) throw new Error(`Unknown provider: ${provider}`)

  const resolvedModel = model || config.models[0]

  switch (provider) {
    case 'pollinations':
      return generateWithPollinations(prompt, resolvedModel, options?.width ?? 768, options?.height ?? 768)
    case 'huggingface':
      return generateWithHuggingFace(prompt, resolvedModel)
    case 'openai':
      return generateWithOpenAI(prompt, resolvedModel)
    case 'stability':
      return generateWithStability(prompt, resolvedModel)
    case 'together':
      return generateWithTogether(prompt, resolvedModel)
    case 'kling':
      return generateWithKling(prompt, resolvedModel, options?.width ?? 768, options?.height ?? 768)
    case 'gemini-imagen':
      return generateWithGeminiImagen(prompt, resolvedModel, options)
    default:
      throw new Error(`No generation handler for provider: ${provider}`)
  }
}

/**
 * Upload a generated image buffer to Vercel Blob.
 * Returns the public blob URL.
 */
export async function uploadToBlob(
  buffer: Buffer,
  requestId: string,
  assetId: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg'
  const pathname = `ai-content/${requestId}/${assetId}.${ext}`
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: mimeType,
  })
  return blob.url
}

// ── Pollinations (free, no key) ─────────────────────────────────────

export async function generateWithPollinations(
  prompt: string,
  model: string,
  width: number,
  height: number,
): Promise<GenerationResult> {
  const seed = Math.floor(Math.random() * 999999)
  const encoded = encodeURIComponent(prompt)
  // Try multiple Pollinations URL formats (API changed in 2026)
  const urls = [
    `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}`,
    `https://pollinations.ai/p/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}`,
  ]

  let res: Response | null = null
  for (const url of urls) {
    try {
      const r = await fetch(url, { redirect: 'follow' })
      if (r.ok && (r.headers.get('content-type') || '').includes('image')) {
        res = r
        break
      }
    } catch { /* try next */ }
  }

  if (!res || !res.ok) {
    throw new Error('Pollinations API unavailable (401). Try HuggingFace or OpenAI instead.')
  }
  if (!res.ok) {
    throw new Error(`Pollinations failed: ${res.status} ${res.statusText}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return {
    buffer,
    mimeType: res.headers.get('content-type') || 'image/jpeg',
    width,
    height,
    metadata: { seed, model },
  }
}

// ── Hugging Face Inference API ──────────────────────────────────────

export async function generateWithHuggingFace(
  prompt: string,
  model: string,
): Promise<GenerationResult> {
  const token = process.env.HF_TOKEN
  if (!token) throw new Error('HF_TOKEN is not set')

  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HuggingFace failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return {
    buffer,
    mimeType: res.headers.get('content-type') || 'image/jpeg',
    metadata: { model },
  }
}

// ── OpenAI DALL-E ───────────────────────────────────────────────────

export async function generateWithOpenAI(
  prompt: string,
  model: string,
): Promise<GenerationResult> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const size = model === 'dall-e-3' ? '1024x1024' : '512x512'
  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size: size as any,
    response_format: 'b64_json',
  })

  const imageData = response.data?.[0]
  const b64 = imageData?.b64_json
  if (!b64) throw new Error('OpenAI returned no image data')

  const buffer = Buffer.from(b64, 'base64')
  const dim = model === 'dall-e-3' ? 1024 : 512

  return {
    buffer,
    mimeType: 'image/png',
    width: dim,
    height: dim,
    metadata: { model, revisedPrompt: imageData?.revised_prompt },
  }
}

// ── Stability AI ────────────────────────────────────────────────────

export async function generateWithStability(
  prompt: string,
  model: string,
): Promise<GenerationResult> {
  const apiKey = process.env.STABILITY_API_KEY
  if (!apiKey) throw new Error('STABILITY_API_KEY is not set')

  // Use form-data for the Stability v2beta API
  const formData = new FormData()
  formData.append('prompt', prompt)
  formData.append('output_format', 'png')

  const endpoint = model === 'stable-image-core'
    ? 'https://api.stability.ai/v2beta/stable-image/generate/core'
    : 'https://api.stability.ai/v2beta/stable-image/generate/sd3'

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'image/*',
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Stability AI failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return {
    buffer,
    mimeType: 'image/png',
    width: 1024,
    height: 1024,
    metadata: { model },
  }
}

// ── Together AI ─────────────────────────────────────────────────────

export async function generateWithTogether(
  prompt: string,
  model: string,
): Promise<GenerationResult> {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) throw new Error('TOGETHER_API_KEY is not set')

  const res = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      width: 1024,
      height: 1024,
      n: 1,
      response_format: 'b64_json',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Together AI failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const b64 = json.data?.[0]?.b64_json
  if (!b64) throw new Error('Together AI returned no image data')

  const buffer = Buffer.from(b64, 'base64')

  return {
    buffer,
    mimeType: 'image/png',
    width: 1024,
    height: 1024,
    metadata: { model },
  }
}

// ── Kling AI ───────────────────────────────────────────────────────

export async function generateWithKling(
  prompt: string,
  model: string,
  width: number,
  height: number,
): Promise<GenerationResult> {
  const { getKlingToken } = await import('./kling-auth')
  const token = getKlingToken()

  const createRes = await fetch('https://api.klingai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      model_name: model.replace('kling-', '').replace('-image', ''),
      prompt,
      image_count: 1,
      aspect_ratio: width === height ? '1:1' : '16:9',
    }),
  })

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => '')
    throw new Error(`Kling image failed (${createRes.status}): ${text.slice(0, 200)}`)
  }

  const createData = await createRes.json()
  const taskId = createData.data?.task_id
  if (!taskId) throw new Error('Kling returned no task_id')

  // Poll for completion
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const pollRes = await fetch(`https://api.klingai.com/v1/images/generations/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!pollRes.ok) continue
    const pollData = await pollRes.json()
    const status = pollData.data?.task_status

    if (status === 'succeed') {
      const imageUrl = pollData.data?.task_result?.images?.[0]?.url
      if (!imageUrl) throw new Error('Kling returned no image URL')
      const imageRes = await fetch(imageUrl)
      return {
        buffer: Buffer.from(await imageRes.arrayBuffer()),
        mimeType: 'image/png',
        width, height,
        metadata: { model, taskId },
      }
    }
    if (status === 'failed') {
      throw new Error(`Kling failed: ${pollData.data?.task_status_msg || 'unknown'}`)
    }
  }
  throw new Error('Kling image generation timed out')
}

// ── Google Gemini Imagen (Nano Banana) ──────────────────────────────

async function generateWithGeminiImagen(
  prompt: string,
  model: string,
  options?: GenerationOptions,
): Promise<GenerationResult> {
  const { generateWithGeminiImagen: generate } = await import('./gemini-imagen-generator')
  const result = await generate(prompt, model, options)
  return {
    buffer: result.buffer,
    mimeType: result.mimeType,
    width: options?.width ?? 1024,
    height: options?.height ?? 1024,
    metadata: { model, provider: 'gemini-imagen' },
  }
}
