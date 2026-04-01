/**
 * OpenAI Sora video generator via direct REST API.
 * The openai npm SDK (v4.x) does not expose a videos resource yet —
 * Sora is accessed through the raw HTTP endpoint.
 *
 * Env var: OPENAI_API_KEY
 * Models: sora, sora-2 (alias: sora-2-pro for higher quality)
 * Docs: https://platform.openai.com/docs/api-reference/video
 */

const SORA_BASE = 'https://api.openai.com/v1'

export async function generateWithSora(
  prompt: string,
  model?: string,
): Promise<{ url: string; durationMs: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  // sora-2-pro → sora (API only accepts "sora" or "sora-2" right now)
  const modelId = (model ?? 'sora-2').replace('-pro', '')

  // Submit video generation job
  const createRes = await fetch(`${SORA_BASE}/video/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      n: 1,
      size: '1280x720',
      duration: 5,
    }),
  })

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => '')
    throw new Error(`Sora create failed (${createRes.status}): ${text.slice(0, 300)}`)
  }

  const job = await createRes.json()
  const jobId = job.id ?? job.generation_id

  if (!jobId) {
    // Some API versions return the video URL directly (synchronous)
    const directUrl = job.data?.[0]?.url ?? job.url
    if (directUrl) {
      return { url: directUrl, durationMs: 5000 }
    }
    throw new Error(`Sora returned no job ID: ${JSON.stringify(job).slice(0, 200)}`)
  }

  // Poll for completion (max 10 min — Sora can be slow)
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))

    const pollRes = await fetch(`${SORA_BASE}/video/generations/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!pollRes.ok) continue

    const status = await pollRes.json()
    const state = status.status ?? status.state

    if (state === 'succeeded' || state === 'completed') {
      const url = status.data?.[0]?.url ?? status.output_url ?? status.url
      if (!url) throw new Error('Sora returned no video URL after completion')
      return { url, durationMs: (status.duration ?? 5) * 1000 }
    }

    if (state === 'failed' || state === 'error') {
      throw new Error(`Sora generation failed: ${status.error ?? status.failure_reason ?? state}`)
    }
  }

  throw new Error('Sora video generation timed out after 10 minutes')
}
