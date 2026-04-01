/**
 * OpenAI Sora video generator via direct REST API.
 *
 * Confirmed working endpoints (probed 2026-04-01):
 *   POST /v1/videos          — create job (no `n` or `duration` params)
 *   GET  /v1/videos/{id}     — poll status
 *   GET  /v1/videos/{id}/content — download mp4 binary
 *
 * Env var: OPENAI_API_KEY
 * Models: sora, sora-2 (sora-2-pro maps to sora-2)
 */

const BASE = 'https://api.openai.com/v1'

export async function generateWithSora(
  prompt: string,
  model?: string,
): Promise<{ buffer: Buffer; durationMs: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  // sora-2-pro → sora-2 (API only accepts "sora" or "sora-2")
  const modelId = (model ?? 'sora-2').replace('-pro', '')

  // Submit generation job
  const createRes = await fetch(`${BASE}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      size: '1280x720',
    }),
  })

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => '')
    throw new Error(`Sora create failed (${createRes.status}): ${text.slice(0, 300)}`)
  }

  const job = await createRes.json()
  const jobId: string = job.id
  if (!jobId) throw new Error(`Sora returned no job ID: ${JSON.stringify(job).slice(0, 200)}`)

  // Poll for completion (max 10 min — Sora typically takes ~45s)
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))

    const pollRes = await fetch(`${BASE}/videos/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!pollRes.ok) continue

    const status = await pollRes.json()

    if (status.status === 'completed') {
      // Download mp4 binary from /content endpoint
      const dlRes = await fetch(`${BASE}/videos/${jobId}/content`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (!dlRes.ok) throw new Error(`Sora content download failed (${dlRes.status})`)
      const buffer = Buffer.from(await dlRes.arrayBuffer())
      const durationMs = parseFloat(status.seconds ?? '5') * 1000
      return { buffer, durationMs }
    }

    if (status.status === 'failed' || status.status === 'error') {
      throw new Error(`Sora generation failed: ${status.error ?? status.failure_reason ?? status.status}`)
    }
  }

  throw new Error('Sora video generation timed out after 10 minutes')
}
