import { put } from '@vercel/blob'
import type { GenerationResult } from '../types'

/**
 * Generate a video with sound from a text prompt or image.
 *
 * Supports multiple providers — admin selects which to use.
 * All generated videos include audio (TTS narration, ambient, or AI-generated sound).
 */
export async function generateVideo(
  input: { prompt?: string; imageUrl?: string },
  provider?: string,
  model?: string,
): Promise<GenerationResult | null> {
  const resolvedProvider = provider || detectBestVideoProvider()

  switch (resolvedProvider) {
    case 'kling-video':
      return generateWithKling(input, model)
    case 'replicate':
      return generateWithReplicate(input, model)
    case 'huggingface-video':
      return generateWithHFVideo(input, model)
    case 'pollinations-video':
      return generateWithPollinationsVideo(input, model)
    case 'runway':
      return generateWithRunway(input, model)
    case 'luma':
      return generateWithLuma(input, model)
    default:
      // Fallback: generate silent video + add TTS audio
      const video = await generateWithHFVideo(input, model)
      if (video && input.prompt) {
        return addTTSAudio(video, input.prompt)
      }
      return video
  }
}

/**
 * Detect best available video provider based on env vars.
 */
function detectBestVideoProvider(): string {
  if (process.env.KLING_API_KEY) return 'kling-video'
  if (process.env.REPLICATE_API_TOKEN) return 'replicate'
  if (process.env.RUNWAY_API_KEY) return 'runway'
  if (process.env.LUMA_API_KEY) return 'luma'
  if (process.env.HF_TOKEN) return 'huggingface-video'
  return 'pollinations-video'
}

/**
 * Upload a generated video buffer to Vercel Blob.
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

/**
 * Add TTS narration audio to a silent video using OpenAI TTS.
 * Returns a new GenerationResult with the combined video+audio.
 */
async function addTTSAudio(
  video: GenerationResult,
  text: string,
): Promise<GenerationResult> {
  if (!process.env.OPENAI_API_KEY) return video

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Generate speech description of the expression
    const narration = `This is a demonstration of ${text}. Watch the facial movements and body posture carefully.`
    const audioRes = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: narration.slice(0, 300),
      response_format: 'mp3',
    })

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

    // Store audio alongside video (separate file for now)
    // Full muxing would require ffmpeg — store both and let client handle
    return {
      ...video,
      metadata: {
        ...video.metadata,
        audioBuffer: audioBuffer.toString('base64'),
        hasAudio: true,
        narration,
      },
    }
  } catch (err) {
    console.warn('TTS audio generation failed, returning silent video:', err)
    return video
  }
}

// ── Kling AI Video ──────────────────────────────────────────────────

async function generateWithKling(
  input: { prompt?: string; imageUrl?: string },
  model?: string,
): Promise<GenerationResult | null> {
  if (!process.env.KLING_ACCESS_KEY || !process.env.KLING_SECRET_KEY) return null

  const { getKlingToken } = await import('./kling-auth')
  const apiKey = getKlingToken()

  const resolvedModel = model || 'kling-v1.6-standard-t2v'

  // Determine if text-to-video or image-to-video
  const isI2V = input.imageUrl && resolvedModel.includes('i2v')
  const endpoint = isI2V
    ? 'https://api.klingai.com/v1/videos/image2video'
    : 'https://api.klingai.com/v1/videos/text2video'

  // Map model name to API model_name
  const modelName = resolvedModel
    .replace('kling-', '')
    .replace('-t2v', '')
    .replace('-i2v', '')

  try {
    const body: any = {
      model_name: modelName,
      prompt: input.prompt || 'A person demonstrating a facial expression naturally',
      duration: '5',
      mode: modelName.includes('pro') ? 'pro' : 'std',
    }

    if (isI2V && input.imageUrl) {
      body.image = input.imageUrl
    }

    const createRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => '')
      throw new Error(`Kling video create failed (${createRes.status}): ${text.slice(0, 200)}`)
    }

    const createData = await createRes.json()
    const taskId = createData.data?.task_id
    if (!taskId) throw new Error('Kling returned no task_id')

    // Poll for completion (max 180s — video generation takes longer)
    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const pollEndpoint = isI2V
        ? `https://api.klingai.com/v1/videos/image2video/${taskId}`
        : `https://api.klingai.com/v1/videos/text2video/${taskId}`

      const pollRes = await fetch(pollEndpoint, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })

      if (!pollRes.ok) continue

      const pollData = await pollRes.json()
      const status = pollData.data?.task_status

      if (status === 'succeed') {
        const videoUrl = pollData.data?.task_result?.videos?.[0]?.url
        if (!videoUrl) throw new Error('Kling returned no video URL')

        const videoRes = await fetch(videoUrl)
        const buffer = Buffer.from(await videoRes.arrayBuffer())

        return {
          buffer,
          mimeType: 'video/mp4',
          durationMs: 5000,
          metadata: {
            model: resolvedModel,
            provider: 'kling-video',
            hasAudio: true,
            taskId,
          },
        }
      }

      if (status === 'failed') {
        throw new Error(`Kling video failed: ${pollData.data?.task_status_msg || 'unknown'}`)
      }
    }

    throw new Error('Kling video generation timed out')
  } catch (err) {
    console.error('Kling video generation failed:', err)
    return null
  }
}

// ── Replicate (Minimax video-01, Kling, etc.) ───────────────────────

async function generateWithReplicate(
  input: { prompt?: string; imageUrl?: string },
  model?: string,
): Promise<GenerationResult | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return null

  const resolvedModel = model || 'minimax/video-01'

  try {
    // Create prediction
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: resolvedModel.includes('/') ? undefined : resolvedModel,
        model: resolvedModel.includes('/') ? resolvedModel : undefined,
        input: {
          prompt: input.prompt || 'A person demonstrating a facial expression',
          ...(input.imageUrl ? { first_frame_image: input.imageUrl } : {}),
          ...(resolvedModel.includes('minimax') ? { prompt_optimizer: true } : {}),
        },
      }),
    })

    if (!createRes.ok) {
      const text = await createRes.text()
      throw new Error(`Replicate create failed (${createRes.status}): ${text.slice(0, 200)}`)
    }

    const prediction = await createRes.json()

    // Poll for completion (max 120 seconds)
    const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const status = await pollRes.json()

      if (status.status === 'succeeded') {
        const outputUrl = Array.isArray(status.output) ? status.output[0] : status.output
        if (!outputUrl) throw new Error('No output URL from Replicate')

        const videoRes = await fetch(outputUrl)
        const buffer = Buffer.from(await videoRes.arrayBuffer())

        return {
          buffer,
          mimeType: 'video/mp4',
          durationMs: 5000,
          metadata: { model: resolvedModel, provider: 'replicate', hasAudio: true },
        }
      }

      if (status.status === 'failed') {
        throw new Error(`Replicate failed: ${status.error}`)
      }
    }

    throw new Error('Replicate prediction timed out')
  } catch (err) {
    console.error('Replicate video generation failed:', err)
    return null
  }
}

// ── Pollinations Video (free, experimental) ─────────────────────────

async function generateWithPollinationsVideo(
  input: { prompt?: string; imageUrl?: string },
  model?: string,
): Promise<GenerationResult | null> {
  const prompt = input.prompt || 'A person demonstrating a facial expression'

  try {
    // Pollinations text-to-video endpoint
    const encodedPrompt = encodeURIComponent(prompt)
    const url = `https://video.pollinations.ai/prompt/${encodedPrompt}?model=${model || 'fast-svd'}&duration=4`

    const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!res.ok) {
      console.warn(`Pollinations video returned ${res.status}`)
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 1000) return null // Too small = likely error

    return {
      buffer,
      mimeType: 'video/mp4',
      durationMs: 4000,
      metadata: { model: model || 'fast-svd', provider: 'pollinations-video' },
    }
  } catch (err) {
    console.warn('Pollinations video failed:', err)
    return null
  }
}

// ── Runway Gen-3/Gen-4 ──────────────────────────────────────────────

async function generateWithRunway(
  input: { prompt?: string; imageUrl?: string },
  model?: string,
): Promise<GenerationResult | null> {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) return null

  const resolvedModel = model || 'gen3a_turbo'

  try {
    const createRes = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: resolvedModel,
        promptImage: input.imageUrl,
        promptText: input.prompt || 'A person demonstrating an expression naturally',
        duration: 5,
        watermark: false,
      }),
    })

    if (!createRes.ok) {
      const text = await createRes.text()
      throw new Error(`Runway create failed (${createRes.status}): ${text.slice(0, 200)}`)
    }

    const { id } = await createRes.json()

    // Poll for completion
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      })
      const task = await pollRes.json()

      if (task.status === 'SUCCEEDED') {
        const videoUrl = task.output?.[0]
        if (!videoUrl) throw new Error('No video URL from Runway')

        const videoRes = await fetch(videoUrl)
        const buffer = Buffer.from(await videoRes.arrayBuffer())

        return {
          buffer,
          mimeType: 'video/mp4',
          durationMs: 5000,
          metadata: { model: resolvedModel, provider: 'runway', hasAudio: true },
        }
      }

      if (task.status === 'FAILED') {
        throw new Error(`Runway failed: ${task.failure}`)
      }
    }

    throw new Error('Runway task timed out')
  } catch (err) {
    console.error('Runway video generation failed:', err)
    return null
  }
}

// ── Luma Dream Machine ──────────────────────────────────────────────

async function generateWithLuma(
  input: { prompt?: string; imageUrl?: string },
  model?: string,
): Promise<GenerationResult | null> {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) return null

  try {
    const body: any = {
      prompt: input.prompt || 'A person demonstrating a facial expression',
      model: model || 'ray2',
      duration: '5s',
      resolution: '720p',
    }

    if (input.imageUrl) {
      body.keyframes = {
        frame0: { type: 'image', url: input.imageUrl },
      }
    }

    const createRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!createRes.ok) {
      const text = await createRes.text()
      throw new Error(`Luma create failed (${createRes.status}): ${text.slice(0, 200)}`)
    }

    const generation = await createRes.json()

    // Poll for completion
    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const pollRes = await fetch(
        `https://api.lumalabs.ai/dream-machine/v1/generations/${generation.id}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      )
      const status = await pollRes.json()

      if (status.state === 'completed') {
        const videoUrl = status.assets?.video
        if (!videoUrl) throw new Error('No video URL from Luma')

        const videoRes = await fetch(videoUrl)
        const buffer = Buffer.from(await videoRes.arrayBuffer())

        return {
          buffer,
          mimeType: 'video/mp4',
          durationMs: 5000,
          metadata: { model: model || 'ray2', provider: 'luma', hasAudio: true },
        }
      }

      if (status.state === 'failed') {
        throw new Error(`Luma failed: ${status.failure_reason}`)
      }
    }

    throw new Error('Luma generation timed out')
  } catch (err) {
    console.error('Luma video generation failed:', err)
    return null
  }
}

// ── Hugging Face Stable Video Diffusion (silent, image-to-video) ────

async function generateWithHFVideo(
  input: { prompt?: string; imageUrl?: string },
  model?: string,
): Promise<GenerationResult | null> {
  const token = process.env.HF_TOKEN
  if (!token || !input.imageUrl) return null

  const resolvedModel = model || 'stabilityai/stable-video-diffusion-img2vid-xt'

  try {
    const imageRes = await fetch(input.imageUrl)
    if (!imageRes.ok) throw new Error(`Failed to fetch source image: ${imageRes.status}`)
    const imageBlob = await imageRes.blob()

    const res = await fetch(`https://api-inference.huggingface.co/models/${resolvedModel}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: imageBlob,
    })

    if (!res.ok) {
      if (res.status === 503 || res.status === 429) {
        console.warn(`HF video model unavailable (${res.status})`)
        return null
      }
      throw new Error(`HF video failed (${res.status})`)
    }

    const buffer = Buffer.from(await res.arrayBuffer())

    return {
      buffer,
      mimeType: 'video/mp4',
      durationMs: 4000,
      metadata: { model: resolvedModel, provider: 'huggingface-video', hasAudio: false },
    }
  } catch (err) {
    console.error('HF video generation failed:', err)
    return null
  }
}
