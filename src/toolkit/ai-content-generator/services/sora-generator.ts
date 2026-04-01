/**
 * OpenAI Sora video generator via direct REST API.
 *
 * Confirmed working endpoints (probed 2026-04-01):
 *   POST /v1/videos                    — create job
 *   GET  /v1/videos/{id}               — poll status
 *   GET  /v1/videos/{id}/content       — download mp4 binary
 *
 * Architecture: submit-then-poll (not blocking).
 * submitSoraJob()  — submits and returns job ID immediately
 * pollSoraJob()    — called by cron to check + download when complete
 *
 * Env var: OPENAI_API_KEY
 * Models: sora, sora-2 (sora-2-pro maps to sora-2)
 */

const BASE = 'https://api.openai.com/v1'

/** Submit a generation job. Returns the Sora job ID immediately. */
export async function submitSoraJob(
  prompt: string,
  model?: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const modelId = (model ?? 'sora-2').replace('-pro', '')

  const createRes = await fetch(`${BASE}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: modelId, prompt, size: '1280x720' }),
  })

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => '')
    throw new Error(`Sora create failed (${createRes.status}): ${text.slice(0, 300)}`)
  }

  const job = await createRes.json()
  if (!job.id) throw new Error(`Sora returned no job ID: ${JSON.stringify(job).slice(0, 200)}`)
  return job.id as string
}

/**
 * Poll a submitted job. Returns the video buffer if complete,
 * null if still in progress, throws on failure.
 */
export async function pollSoraJob(
  jobId: string,
): Promise<{ buffer: Buffer; durationMs: number } | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const pollRes = await fetch(`${BASE}/videos/${jobId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  if (!pollRes.ok) return null

  const status = await pollRes.json()

  if (status.status === 'completed') {
    const dlRes = await fetch(`${BASE}/videos/${jobId}/content`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!dlRes.ok) throw new Error(`Sora content download failed (${dlRes.status})`)
    const buffer = Buffer.from(await dlRes.arrayBuffer())
    return { buffer, durationMs: parseFloat(status.seconds ?? '5') * 1000 }
  }

  if (status.status === 'failed' || status.status === 'error') {
    throw new Error(`Sora generation failed: ${status.error ?? status.failure_reason ?? status.status}`)
  }

  return null // still in_progress / queued
}
