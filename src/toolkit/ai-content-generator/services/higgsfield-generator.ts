/**
 * Higgsfield video generator (experimental).
 * REST API at cloud.higgsfield.ai
 * Env var: HIGGSFIELD_API_KEY
 * Status: Early access, sparse documentation
 */

/** Submit a Higgsfield job. Returns the task ID immediately. */
export async function submitHiggsfieldJob(
  prompt: string,
  model?: string,
): Promise<string> {
  const apiKey = process.env.HIGGSFIELD_API_KEY
  if (!apiKey) throw new Error('HIGGSFIELD_API_KEY not configured')

  const response = await fetch('https://cloud.higgsfield.ai/api/v1/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ prompt, model: model ?? 'diffuse-xl', duration: 5, resolution: '720p' }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Higgsfield API error: ${response.status} ${error}`)
  }

  const task = await response.json()
  const taskId = task.id ?? task.task_id
  if (!taskId) throw new Error(`Higgsfield returned no task ID: ${JSON.stringify(task).slice(0, 200)}`)
  return taskId as string
}

/**
 * Poll a submitted Higgsfield job.
 * Returns video buffer if complete, null if still in progress, throws on failure.
 */
export async function pollHiggsfieldJob(
  taskId: string,
): Promise<{ buffer: Buffer; durationMs: number } | null> {
  const apiKey = process.env.HIGGSFIELD_API_KEY
  if (!apiKey) throw new Error('HIGGSFIELD_API_KEY not configured')

  const statusRes = await fetch(`https://cloud.higgsfield.ai/api/v1/videos/${taskId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  if (!statusRes.ok) return null

  const data = await statusRes.json()

  if (data.status === 'completed' || data.status === 'succeeded') {
    const videoUrl = data.output_url ?? data.video_url ?? data.url
    if (!videoUrl) throw new Error('Higgsfield returned no video URL')
    const videoRes = await fetch(videoUrl)
    const buffer = Buffer.from(await videoRes.arrayBuffer())
    return { buffer, durationMs: (data.duration ?? 5) * 1000 }
  }

  if (data.status === 'failed') {
    throw new Error(`Higgsfield generation failed: ${data.error ?? 'unknown'}`)
  }

  return null // still processing
}
