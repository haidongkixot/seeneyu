import fs from 'node:fs/promises'
import path from 'node:path'

type Practice = {
  id: string
  title: string
  estimatedDurationSec?: number
  sceneDescription?: string
  characterName?: string
  characterDescription?: string
  mainVideo?: {
    durationSec?: number
    aspectRatio?: string
    prompt?: string
  }
}

type SoraStatus = {
  id: string
  status: string
  seconds?: string
  [key: string]: unknown
}

const SUPPORTED_SECONDS = ['4', '8', '12'] as const

async function main() {
  const args = parseArgs(process.argv.slice(2))
  loadLocalEnv(process.cwd())

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey && !args.dryRun) {
    throw new Error('OPENAI_API_KEY not configured in .env.local or .env')
  }

  const inputPath = path.resolve(process.cwd(), args.input ?? 'scripts/data/ai-practices-batch-01.json')
  const practices = await readPracticeArray(inputPath)
  const practice = selectPractice(practices, args)
  const requestedSeconds = args.seconds ?? practice.mainVideo?.durationSec ?? practice.estimatedDurationSec ?? 8
  const seconds = normalizeSeconds(requestedSeconds)
  const size = mapAspectRatioToSize(practice.mainVideo?.aspectRatio ?? '16:9')
  const outputDir = path.resolve(process.cwd(), 'scripts/data/generated', practice.id)
  const prompt = buildPrompt(practice, seconds)

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'prompt.txt'), `${prompt}\n`)

  const manifest = {
    practiceId: practice.id,
    title: practice.title,
    sourceFile: inputPath,
    requestedSeconds,
    effectiveSeconds: seconds,
    size,
    outputDir,
    generatedAt: new Date().toISOString(),
  }
  await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, ...manifest }, null, 2))
    return
  }

  const submission = await submitSoraJob({
    apiKey: apiKey!,
    prompt,
    size,
    seconds,
  })

  await fs.writeFile(path.join(outputDir, 'submission.json'), JSON.stringify({
    ...manifest,
    jobId: submission.id,
    submittedAt: new Date().toISOString(),
    submission,
  }, null, 2))

  const status = await pollUntilComplete({
    apiKey: apiKey!,
    jobId: submission.id,
    outputDir,
  })

  const buffer = await downloadVideo(apiKey!, submission.id)
  const outputPath = path.join(outputDir, `${practice.id}-sora.mp4`)
  await fs.writeFile(outputPath, buffer)

  console.log(JSON.stringify({
    practiceId: practice.id,
    title: practice.title,
    jobId: submission.id,
    status: status.status,
    seconds: status.seconds ?? seconds,
    outputPath,
    bytes: buffer.length,
  }, null, 2))
}

function parseArgs(argv: string[]) {
  const parsed: {
    input?: string
    index?: number
    id?: string
    seconds?: number
    dryRun?: boolean
  } = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--input':
        parsed.input = argv[++i]
        break
      case '--index':
        parsed.index = Number(argv[++i])
        break
      case '--id':
        parsed.id = argv[++i]
        break
      case '--seconds':
        parsed.seconds = Number(argv[++i])
        break
      case '--dry-run':
        parsed.dryRun = true
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return parsed
}

function loadLocalEnv(cwd: string) {
  for (const fileName of ['.env.local', '.env']) {
    const fullPath = path.join(cwd, fileName)
    try {
      const raw = require('node:fs').readFileSync(fullPath, 'utf8') as string
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
        if (!match) continue
        const [, key, rest] = match
        let value = rest.trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value.replace(/\\n/g, '\n')
        }
      }
    } catch {
      // Ignore missing local env files.
    }
  }
}

async function readPracticeArray(inputPath: string): Promise<Practice[]> {
  const raw = JSON.parse(await fs.readFile(inputPath, 'utf8'))
  if (!Array.isArray(raw)) {
    throw new Error(`Expected top-level array in ${inputPath}`)
  }
  return raw as Practice[]
}

function selectPractice(practices: Practice[], args: { index?: number; id?: string }): Practice {
  if (args.id) {
    const match = practices.find((practice) => practice.id === args.id)
    if (!match) throw new Error(`Practice id not found: ${args.id}`)
    return match
  }

  const index = args.index ?? 0
  if (!Number.isInteger(index) || index < 0 || index >= practices.length) {
    throw new Error(`Practice index out of range: ${index}`)
  }
  return practices[index]
}

function normalizeSeconds(seconds: number): typeof SUPPORTED_SECONDS[number] {
  const rounded = Math.max(1, Math.round(seconds))
  let closest = SUPPORTED_SECONDS[0]
  let bestDistance = Math.abs(rounded - Number(closest))

  for (const candidate of SUPPORTED_SECONDS.slice(1)) {
    const distance = Math.abs(rounded - Number(candidate))
    if (distance < bestDistance) {
      closest = candidate
      bestDistance = distance
    }
  }

  return closest
}

function mapAspectRatioToSize(aspectRatio: string): string {
  switch (aspectRatio) {
    case '9:16':
      return '720x1280'
    case '1:1':
      return '720x720'
    case '4:3':
      return '960x720'
    case '16:9':
    default:
      return '1280x720'
  }
}

function buildPrompt(practice: Practice, seconds: typeof SUPPORTED_SECONDS[number]): string {
  const mainPrompt = practice.mainVideo?.prompt?.trim()
  if (mainPrompt) {
    const sanitizedPrompt = sanitizePrompt(mainPrompt)
    return [
      `Create a ${seconds}-second video.`,
      sanitizedPrompt,
      'Adjust all story beats proportionally so the full action fits cleanly within the requested duration.',
      'Use original character and scene design rather than referencing any existing franchise or copyrighted style.',
      'Avoid text overlays, subtitles, logos, watermarks, abrupt cuts, and visible glitches.',
    ].join(' ')
  }

  return [
    `Create a ${seconds}-second video based on the following practice.`,
    `Title: ${practice.title}.`,
    practice.characterName ? `Character: ${practice.characterName}.` : '',
    practice.characterDescription ? `Character details: ${practice.characterDescription}` : '',
    practice.sceneDescription ? `Scene: ${practice.sceneDescription}` : '',
    'Use expressive, readable body language and clean cinematic framing.',
    'Avoid text overlays, subtitles, logos, watermarks, abrupt cuts, and visible glitches.',
  ].filter(Boolean).join(' ')
}

function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/Pixar-style/gi, 'stylized family-friendly')
    .replace(/in the visual tone of [^.]+\.?/gi, '')
    .replace(/DreamWorks-style/gi, 'stylized cinematic')
    .replace(/Disney-style/gi, 'stylized animated')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function submitSoraJob(input: {
  apiKey: string
  prompt: string
  size: string
  seconds: typeof SUPPORTED_SECONDS[number]
}) {
  const res = await fetch('https://api.openai.com/v1/videos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sora-2',
      prompt: input.prompt,
      size: input.size,
      seconds: input.seconds,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Sora create failed (${res.status}): ${text.slice(0, 1200)}`)
  }

  return JSON.parse(text) as { id: string; [key: string]: unknown }
}

async function pollUntilComplete(input: {
  apiKey: string
  jobId: string
  outputDir: string
}) {
  for (let attempt = 1; attempt <= 60; attempt++) {
    const status = await getJsonWithRetry<SoraStatus>(
      `https://api.openai.com/v1/videos/${input.jobId}`,
      input.apiKey,
    )

    await fs.writeFile(path.join(input.outputDir, 'status.json'), JSON.stringify({
      checkedAt: new Date().toISOString(),
      attempt,
      status,
    }, null, 2))

    if (status.status === 'completed') {
      return status
    }

    if (status.status === 'failed' || status.status === 'error') {
      throw new Error(`Sora job failed: ${JSON.stringify(status, null, 2).slice(0, 2000)}`)
    }

    console.log(`attempt ${attempt}: ${status.status}`)
    await sleep(20_000)
  }

  throw new Error(`Timed out waiting for job ${input.jobId}`)
}

async function downloadVideo(apiKey: string, jobId: string) {
  return getBufferWithRetry(`https://api.openai.com/v1/videos/${jobId}/content`, apiKey)
}

async function getJsonWithRetry<T>(url: string, apiKey: string, maxAttempts = 4): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const text = await res.text()
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 1200)}`)
      }
      return JSON.parse(text) as T
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await sleep(5_000 * attempt)
      }
    }
  }
  throw lastError
}

async function getBufferWithRetry(url: string, apiKey: string, maxAttempts = 4) {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 1200)}`)
      }
      return Buffer.from(await res.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await sleep(5_000 * attempt)
      }
    }
  }
  throw lastError
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
