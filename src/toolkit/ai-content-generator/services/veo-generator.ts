/**
 * Google Veo video generator (Nano Banana Video).
 * Uses predictLongRunning endpoint via Generative Language API.
 *
 * Confirmed models (2026-04-02):
 *   veo-2.0-generate-001
 *   veo-3.0-generate-001
 *   veo-3.0-fast-generate-001
 *   veo-3.1-generate-preview
 *   veo-3.1-fast-generate-preview
 *
 * Env var: GOOGLE_AI_API_KEY
 * Requires paid Google AI Studio plan.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/** Submit a Veo video generation job. Returns the operation name (used to poll). */
export async function submitVeoJob(
  prompt: string,
  model?: string,
  options?: { aspectRatio?: string; duration?: number },
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')

  const modelId = model ?? 'veo-2.0-generate-001'
  const aspectRatio = options?.aspectRatio ?? '16:9'
  const durationSeconds = options?.duration ?? 5

  const res = await fetch(`${BASE}/models/${modelId}:predictLongRunning?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{
        prompt,
      }],
      parameters: {
        aspectRatio,
        durationSeconds,
        sampleCount: 1,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Veo create failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const operation = await res.json()
  const opName = operation.name
  if (!opName) throw new Error(`Veo returned no operation name: ${JSON.stringify(operation).slice(0, 200)}`)
  return opName
}

/**
 * Poll a submitted Veo job.
 * Returns video buffer if complete, null if still in progress, throws on failure.
 */
export async function pollVeoJob(
  operationName: string,
): Promise<{ buffer: Buffer; durationMs: number } | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')

  // Poll the operation status
  const res = await fetch(`${BASE}/${operationName}?key=${apiKey}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) return null

  const operation = await res.json()

  if (operation.error) {
    throw new Error(`Veo generation failed: ${operation.error.message ?? JSON.stringify(operation.error)}`)
  }

  if (!operation.done) return null // still in progress

  // Extract video from response — Veo returns two possible shapes:
  //   1. response.predictions[].bytesBase64Encoded (older API)
  //   2. response.generateVideoResponse.generatedSamples[].video.uri (current API)
  const predictions = operation.response?.predictions ?? []
  const prediction = predictions[0]

  // Shape 1: predictions array with base64 or video URI
  if (prediction?.bytesBase64Encoded) {
    const buffer = Buffer.from(prediction.bytesBase64Encoded, 'base64')
    return { buffer, durationMs: 5000 }
  }
  if (prediction?.video?.uri) {
    const videoRes = await fetch(`${prediction.video.uri}&key=${apiKey}`)
    if (!videoRes.ok) throw new Error(`Veo video download failed (${videoRes.status})`)
    const buffer = Buffer.from(await videoRes.arrayBuffer())
    return { buffer, durationMs: 5000 }
  }

  // Shape 2: generateVideoResponse.generatedSamples (current Veo API)
  const samples = operation.response?.generateVideoResponse?.generatedSamples ?? []
  const sample = samples[0]
  if (sample?.video?.uri) {
    const videoRes = await fetch(`${sample.video.uri}&key=${apiKey}`)
    if (!videoRes.ok) throw new Error(`Veo video download failed (${videoRes.status})`)
    const buffer = Buffer.from(await videoRes.arrayBuffer())
    return { buffer, durationMs: 5000 }
  }

  throw new Error(`Veo returned unexpected response shape: ${JSON.stringify(operation.response).slice(0, 300)}`)
}
