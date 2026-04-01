/**
 * Higgsfield video generator (experimental).
 * REST API at cloud.higgsfield.ai
 * Env var: HIGGSFIELD_API_KEY
 * Status: Early access, sparse documentation
 */

export async function generateWithHiggsfield(
  prompt: string,
  model?: string,
): Promise<{ url: string; durationMs: number } | null> {
  const apiKey = process.env.HIGGSFIELD_API_KEY
  if (!apiKey) {
    console.warn('[Higgsfield] API key not configured — skipping')
    return null
  }

  // Submit generation task
  const response = await fetch('https://cloud.higgsfield.ai/api/v1/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      model: model ?? 'diffuse-xl',
      duration: 5,
      resolution: '720p',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Higgsfield API error: ${response.status} ${error}`)
  }

  const task = await response.json()
  const taskId = task.id ?? task.task_id

  // Poll for completion (max 2 min)
  let attempts = 0
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 3000))
    const statusRes = await fetch(`https://cloud.higgsfield.ai/api/v1/videos/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const statusData = await statusRes.json()

    if (statusData.status === 'completed' || statusData.status === 'succeeded') {
      return {
        url: statusData.output_url ?? statusData.video_url ?? statusData.url,
        durationMs: (statusData.duration ?? 5) * 1000,
      }
    }
    if (statusData.status === 'failed') {
      throw new Error(`Higgsfield generation failed: ${statusData.error ?? 'unknown'}`)
    }
    attempts++
  }

  throw new Error('Higgsfield generation timed out after 3 minutes')
}
