/**
 * import-hollywood-clips.js
 *
 * Orchestration script that imports clips from `scripts/data/50-hollywood-clips.json`
 * and fully populates each clip with:
 *   1. Clip record (with sensible scoring defaults)
 *   2. YouTube transcript -> `script` field
 *   3. GPT-4o-mini observation guide -> `observationGuide` JSON
 *   4. GPT-4o-mini practice steps (4-5) with imagePrompt -> PracticeStep records
 *   5. DALL-E 2 demo images per step -> Vercel Blob -> `demoImageUrl`
 *   6. GPT-4o-mini auto-tags (genre / purpose / trait) -> ClipTag records
 *
 * The script is idempotent at the clip level: if a clip with the same
 * `youtubeVideoId` already exists, it is skipped entirely. Each phase per
 * clip is wrapped in its own try/catch so a failure in (e.g.) image
 * generation does not block clip creation or downstream phases.
 *
 * Usage:
 *   node scripts/import-hollywood-clips.js                # full run
 *   node scripts/import-hollywood-clips.js --dry          # no DB writes / no API calls
 *   node scripts/import-hollywood-clips.js --limit 5      # only first 5 clips
 *   node scripts/import-hollywood-clips.js --limit 10 --dry
 *
 * Environment (.env.local):
 *   DATABASE_URL              — Neon Postgres
 *   OPENAI_API_KEY            — OpenAI (GPT-4o-mini + DALL-E 2)
 *   BLOB_READ_WRITE_TOKEN     — Vercel Blob (for step demo image upload)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const OpenAI = require('openai').default ?? require('openai')
const { put } = require('@vercel/blob')

// `youtube-transcript` is ESM-only — use dynamic import at runtime.
let YoutubeTranscript = null
async function loadYoutubeTranscript() {
  if (YoutubeTranscript) return YoutubeTranscript
  try {
    const mod = await import('youtube-transcript')
    YoutubeTranscript = mod.YoutubeTranscript ?? mod.default?.YoutubeTranscript ?? mod.default
    return YoutubeTranscript
  } catch {
    return null
  }
}

// ── CLI args ─────────────────────────────────────────────────────────
const DRY = process.argv.includes('--dry')
const LIMIT = (() => {
  const idx = process.argv.indexOf('--limit')
  if (idx === -1) return null
  const n = parseInt(process.argv[idx + 1], 10)
  return Number.isFinite(n) && n > 0 ? n : null
})()

// ── Clients ──────────────────────────────────────────────────────────
const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Constants ────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'data', '50-hollywood-clips.json')

const CLIP_DEFAULTS = {
  difficultyScore:       8,
  signalClarity:         2,
  noiseLevel:            2,
  contextDependency:     2,
  replicationDifficulty: 2,
  isActive:              true,
}

const STEPS_BY_SKILL = {
  'eye-contact':            5,
  'open-posture':           5,
  'active-listening':       5,
  'vocal-pacing':           5,
  'confident-disagreement': 5,
  'hand-gestures':          5,
  'facial-expressions':     4,
  'default':                4,
}

// Tag vocabularies — must mirror auto-tag-clips.js
const VALID_GENRES = [
  'drama', 'comedy', 'action', 'thriller', 'romance',
  'ted-talk', 'ai-generated', 'documentary', 'animation',
]
const VALID_PURPOSES = [
  'for-work', 'for-hobby', 'for-performing',
  'for-education', 'for-social', 'for-leadership',
]
const VALID_TRAITS = [
  'confident', 'empathetic', 'aggressive', 'vulnerable',
  'humorous', 'authoritative', 'calm', 'passionate',
]

// Delays (ms)
const DELAY_BETWEEN_CLIPS = 1000
const DELAY_BETWEEN_STEPS = 500

// ── Utilities ────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function parseJsonLoose(content) {
  try {
    return JSON.parse(content)
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('No JSON object found in model response')
    return JSON.parse(m[0])
  }
}

// ── Phase 1: YouTube transcript ──────────────────────────────────────
async function fetchTranscript(videoId) {
  const YT = await loadYoutubeTranscript()
  if (!YT) return null
  try {
    let segments = null
    try {
      segments = await YT.fetchTranscript(videoId, { lang: 'en' })
    } catch {
      segments = await YT.fetchTranscript(videoId)
    }
    if (!Array.isArray(segments) || segments.length === 0) return null
    return segments.map((s) => s.text).join(' ').slice(0, 2000)
  } catch {
    return null
  }
}

// ── Phase 2: Observation guide ───────────────────────────────────────
function buildObservationPrompt(clip, transcript) {
  const dialogue = transcript ? `\nDialogue: "${transcript.slice(0, 500)}"` : ''
  return `You are a body language coach analyzing a movie clip.
Movie: ${clip.movieTitle}${clip.year ? ` (${clip.year})` : ''}
Character: ${clip.characterName ?? 'unknown'} played by ${clip.actorName ?? 'unknown'}
Scene: ${clip.sceneDescription}
Skill focus: ${clip.skillCategory}
Coaching note: ${clip.annotation}${dialogue}

Generate an observation guide pointing out 4-5 specific moments in the clip where the actor demonstrates ${clip.skillCategory}. Return JSON:
{
  "headline": "What ${clip.characterName ?? 'the character'} does — and why it works",
  "moments": [
    {
      "atSecond": 5,
      "technique": "Sustained Hold",
      "what": "visible behaviour the learner should notice",
      "why": "psychological reason this works"
    }
  ]
}`
}

async function generateObservationGuide(clip, transcript) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildObservationPrompt(clip, transcript) }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: 0.5,
  })
  const raw = response.choices[0]?.message?.content ?? '{}'
  return parseJsonLoose(raw)
}

// ── Phase 3: Practice steps ──────────────────────────────────────────
function buildPracticePrompt(clip) {
  let momentsText = ''
  if (clip.observationGuide) {
    const guide = typeof clip.observationGuide === 'string'
      ? JSON.parse(clip.observationGuide)
      : clip.observationGuide
    const moments = guide.moments ?? []
    momentsText = moments
      .map((m, i) => `${i + 1}. At ${m.atSecond}s — ${m.technique}: ${m.what} (Why: ${m.why})`)
      .join('\n')
  }

  const skillLabel = (clip.skillCategory || 'eye-contact').replace(/-/g, ' ')
  const numSteps = STEPS_BY_SKILL[clip.skillCategory] ?? STEPS_BY_SKILL['default']
  const isAiGenerated = clip.movieTitle?.toLowerCase().includes('ai generated')

  const mediaContext = isAiGenerated
    ? `This is an AI-generated image practice. The learner looks at a still image and practices the technique.`
    : `The learner watches a movie clip and then records themselves mimicking the performance.`

  return `You are a body language and communication coach designing a step-by-step practice guide.

${mediaContext}

Clip context:
- Skill category: ${skillLabel}
- Difficulty: ${clip.difficulty ?? 'beginner'}
- Source: ${clip.movieTitle}${clip.characterName ? ` (character: ${clip.characterName})` : ''}
- Scene: ${clip.sceneDescription}
${clip.annotation ? `- Coaching note: ${clip.annotation}` : ''}
${momentsText ? `- Observation guide moments:\n${momentsText}` : ''}
${clip.script ? `- Script excerpt: "${String(clip.script).slice(0, 400)}"` : ''}

Generate exactly ${numSteps} practice steps that guide a learner to practice ${skillLabel}. Each step should:
- Focus on ONE specific micro-technique
- Have a clear, actionable instruction (2-3 sentences — tell the learner exactly what to do with their body)
- Include a brief coaching tip (1 sentence, practical and specific)
- Suggest a recording duration 10-30 seconds
- Include a detailed imagePrompt (1-2 sentences) describing a sketch-style illustration of this step — body position, facial expression, posture

Return valid JSON only:
{
  "steps": [
    {
      "stepNumber": 1,
      "skillFocus": "Technique name (3-5 words)",
      "instruction": "Stand tall and...",
      "tip": "Pro tip: ...",
      "targetDurationSec": 20,
      "imagePrompt": "A minimalist sketch showing a person..."
    }
  ]
}`
}

async function generatePracticeSteps(clip) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPracticePrompt(clip) }],
    response_format: { type: 'json_object' },
    max_tokens: 1800,
    temperature: 0.7,
  })
  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = parseJsonLoose(raw)
  return (parsed.steps ?? []).map((s, i) => ({
    stepNumber:        s.stepNumber ?? i + 1,
    skillFocus:        String(s.skillFocus ?? ''),
    instruction:       String(s.instruction ?? ''),
    tip:               s.tip ? String(s.tip) : null,
    targetDurationSec: Number(s.targetDurationSec) || 20,
    imagePrompt:       s.imagePrompt ? String(s.imagePrompt) : null,
  }))
}

// ── Phase 4: DALL-E 2 image per step ─────────────────────────────────
async function generateImage(prompt) {
  const safePrompt = `A clean minimalist sketch-style educational illustration: ${prompt}. Simple line drawing, white background, no text, no labels, body language coaching reference.`

  const response = await openai.images.generate({
    model: 'dall-e-2',
    prompt: safePrompt.slice(0, 1000),
    n: 1,
    size: '512x512',
    response_format: 'b64_json',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error('DALL-E returned no image data')

  const buffer = Buffer.from(b64, 'base64')
  if (buffer.length < 5000) throw new Error('DALL-E returned suspiciously small image')

  return buffer
}

async function uploadStepImage(buffer, clipId, stepNumber) {
  const pathname = `practice-demos-${clipId}/step-${stepNumber}.png`
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: 'image/png',
  })
  return blob.url
}

// ── Phase 5: Auto-tagging ────────────────────────────────────────────
function buildTagPrompt(clip) {
  const parts = [
    `You are a content classifier for a body language coaching app.`,
    `Analyze the following clip metadata and classify it into genres, purposes, and character traits.`,
    ``,
    `Clip metadata:`,
    `- Movie/Source: ${clip.movieTitle}`,
  ]
  if (clip.year) parts.push(`- Year: ${clip.year}`)
  if (clip.characterName) parts.push(`- Character: ${clip.characterName}`)
  if (clip.actorName) parts.push(`- Actor: ${clip.actorName}`)
  if (clip.sceneDescription) parts.push(`- Scene description: ${clip.sceneDescription}`)
  if (clip.annotation) parts.push(`- Coaching annotation: ${clip.annotation}`)
  if (clip.skillCategory) parts.push(`- Skill category: ${clip.skillCategory}`)
  if (clip.script) parts.push(`- Script excerpt: "${String(clip.script).slice(0, 500)}"`)
  if (clip.mediaType) parts.push(`- Media type: ${clip.mediaType}`)

  parts.push(``)
  parts.push(`Classify this clip into the following categories. Pick ALL that apply with a confidence score (0.0-1.0).`)
  parts.push(``)
  parts.push(`Genres (pick 1-3): ${VALID_GENRES.join(', ')}`)
  parts.push(`Purposes (pick 1-3): ${VALID_PURPOSES.join(', ')}`)
  parts.push(`Traits (pick 1-4): ${VALID_TRAITS.join(', ')}`)
  parts.push(``)
  parts.push(`Rules:`)
  parts.push(`- Only use the exact values listed above`)
  parts.push(`- If mediaType is "ai_image" or "ai_video", include "ai-generated" in genres`)
  parts.push(`- If the source mentions "TED" or is a TED talk, include "ted-talk" in genres`)
  parts.push(`- Confidence should reflect how strongly this clip fits the category`)
  parts.push(``)
  parts.push(`Return valid JSON:`)
  parts.push(`{`)
  parts.push(`  "genres": [{"value": "drama", "confidence": 0.9}],`)
  parts.push(`  "purposes": [{"value": "for-work", "confidence": 0.8}],`)
  parts.push(`  "traits": [{"value": "confident", "confidence": 0.95}]`)
  parts.push(`}`)
  return parts.join('\n')
}

async function classifyClip(clip) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildTagPrompt(clip) }],
    response_format: { type: 'json_object' },
    max_tokens: 600,
    temperature: 0.3,
  })
  const raw = response.choices[0]?.message?.content ?? '{}'
  return parseJsonLoose(raw)
}

function buildTagRecords(clipId, classification) {
  const records = []
  const categories = [
    { key: 'genres',   category: 'genre',   valid: VALID_GENRES },
    { key: 'purposes', category: 'purpose', valid: VALID_PURPOSES },
    { key: 'traits',   category: 'trait',   valid: VALID_TRAITS },
  ]
  for (const { key, category, valid } of categories) {
    const items = classification[key] ?? []
    for (const item of items) {
      const value = String(item.value ?? '').toLowerCase().trim()
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0.5
      if (!valid.includes(value)) continue
      records.push({
        clipId,
        category,
        value,
        source: confidence >= 0.8 ? 'ai-confirmed' : 'ai-auto',
        confidence,
      })
    }
  }
  return records
}

// ── Build Clip create payload from JSON entry ────────────────────────
function buildClipData(entry) {
  return {
    youtubeVideoId:        String(entry.youtubeVideoId),
    startSec:              Number(entry.startSec ?? 0),
    endSec:                Number(entry.endSec ?? 0),
    movieTitle:            String(entry.movieTitle ?? 'Untitled'),
    year:                  entry.year != null ? Number(entry.year) : null,
    characterName:         entry.characterName ?? null,
    actorName:             entry.actorName ?? null,
    sceneDescription:      String(entry.sceneDescription ?? ''),
    skillCategory:         String(entry.skillCategory ?? 'eye-contact'),
    difficulty:            String(entry.difficulty ?? 'beginner'),
    annotation:            String(entry.annotation ?? ''),
    contextNote:           entry.contextNote ?? null,
    screenplaySource:      entry.screenplaySource ?? null,
    screenplayText:        entry.screenplayText ?? null,
    mediaType:             entry.mediaType ?? null,
    mediaUrl:              entry.mediaUrl ?? null,
    ...CLIP_DEFAULTS,
  }
}

// ── Process a single clip end-to-end ─────────────────────────────────
async function processClip(entry, index, total, summary) {
  const label = `${entry.movieTitle ?? 'Untitled'} (${entry.skillCategory ?? '?'})`
  process.stdout.write(`  [${index + 1}/${total}] ${label} — `)

  // ── Skip if exists ───────────────────────────────────────────────
  if (!DRY) {
    const existing = await prisma.clip.findFirst({
      where: { youtubeVideoId: entry.youtubeVideoId },
      select: { id: true },
    })
    if (existing) {
      console.log('skip (exists)')
      summary.skipped++
      return
    }
  }

  // ── Phase 1: Create clip ─────────────────────────────────────────
  let clip
  try {
    const data = buildClipData(entry)
    process.stdout.write('creating... ')
    if (DRY) {
      clip = { id: 'dry-' + index, ...data, observationGuide: null, script: null }
    } else {
      clip = await prisma.clip.create({ data })
    }
    summary.clipsCreated++
  } catch (err) {
    console.log(`FAILED clip create: ${err.message}`)
    summary.errors.push({ clip: label, phase: 'create', error: err.message })
    return
  }

  // ── Phase 2: Transcript ──────────────────────────────────────────
  try {
    process.stdout.write('transcript... ')
    const transcript = DRY ? null : await fetchTranscript(entry.youtubeVideoId)
    if (transcript && !DRY) {
      await prisma.clip.update({
        where: { id: clip.id },
        data: { script: transcript },
      })
      clip.script = transcript
    }
  } catch (err) {
    summary.warnings.push({ clip: label, phase: 'transcript', error: err.message })
  }

  // ── Phase 3: Observation guide ───────────────────────────────────
  try {
    process.stdout.write('obs guide... ')
    if (!DRY) {
      const guide = await generateObservationGuide(clip, clip.script)
      await prisma.clip.update({
        where: { id: clip.id },
        data: { observationGuide: JSON.parse(JSON.stringify(guide)) },
      })
      clip.observationGuide = guide
    }
  } catch (err) {
    summary.warnings.push({ clip: label, phase: 'observation', error: err.message })
  }

  // ── Phase 4: Practice steps ──────────────────────────────────────
  let createdSteps = []
  try {
    const steps = DRY ? [] : await generatePracticeSteps(clip)
    process.stdout.write(`${steps.length} steps... `)
    if (!DRY && steps.length > 0) {
      // Create sequentially so we can attach the DB id and stepNumber to each
      for (const step of steps) {
        const created = await prisma.practiceStep.create({
          data: {
            clipId:            clip.id,
            stepNumber:        step.stepNumber,
            skillFocus:        step.skillFocus,
            instruction:       step.instruction,
            tip:               step.tip,
            targetDurationSec: step.targetDurationSec,
            // NOTE: imagePrompt is NOT a column on PracticeStep — we keep
            // it in memory only and use it to drive DALL-E generation below.
          },
        })
        createdSteps.push({ ...created, imagePrompt: step.imagePrompt })
        summary.practiceSteps++
      }
    }
  } catch (err) {
    summary.warnings.push({ clip: label, phase: 'practice-steps', error: err.message })
  }

  // ── Phase 5: Demo image per step ─────────────────────────────────
  let imageCount = 0
  if (!DRY && createdSteps.length > 0) {
    for (let s = 0; s < createdSteps.length; s++) {
      const step = createdSteps[s]
      const prompt = step.imagePrompt
        || `A person demonstrating: ${step.instruction} Skill: ${(clip.skillCategory || '').replace(/-/g, ' ')}.`
      try {
        const buffer = await generateImage(prompt)
        const url = await uploadStepImage(buffer, clip.id, step.stepNumber)
        await prisma.practiceStep.update({
          where: { id: step.id },
          data: { demoImageUrl: url },
        })
        imageCount++
        summary.images++
      } catch (err) {
        summary.warnings.push({
          clip: label,
          phase: `image-step-${step.stepNumber}`,
          error: err.message,
        })
      }
      if (s < createdSteps.length - 1) await sleep(DELAY_BETWEEN_STEPS)
    }
  }
  process.stdout.write(`${imageCount} images... `)

  // ── Phase 6: Auto-tagging ────────────────────────────────────────
  let tagCount = 0
  try {
    if (!DRY) {
      const classification = await classifyClip(clip)
      const records = buildTagRecords(clip.id, classification)
      if (records.length > 0) {
        await prisma.$transaction(records.map((tag) => prisma.clipTag.create({ data: tag })))
        tagCount = records.length
        summary.tags += records.length
      }
    }
  } catch (err) {
    summary.warnings.push({ clip: label, phase: 'tags', error: err.message })
  }
  process.stdout.write(`${tagCount} tags... `)

  console.log('done')
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nHollywood Clips Importer${DRY ? ' [DRY RUN]' : ''}`)
  console.log('─'.repeat(60))

  // Probe youtube-transcript availability (dynamic ESM import)
  const yt = await loadYoutubeTranscript()
  if (!yt) {
    console.log('Note: `youtube-transcript` not loadable — script field will be null for all clips.')
  }

  // Load JSON
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`ERROR: data file not found: ${DATA_FILE}`)
    process.exit(1)
  }
  let entries
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    entries = Array.isArray(parsed) ? parsed : (parsed.clips ?? [])
  } catch (err) {
    console.error(`ERROR: failed to parse ${DATA_FILE}: ${err.message}`)
    process.exit(1)
  }

  if (LIMIT) entries = entries.slice(0, LIMIT)
  console.log(`Loaded ${entries.length} clip entries from ${path.basename(DATA_FILE)}`)
  if (LIMIT) console.log(`Limit applied: processing first ${LIMIT}`)
  console.log()

  const summary = {
    clipsCreated:  0,
    skipped:       0,
    practiceSteps: 0,
    images:        0,
    tags:          0,
    errors:        [],
    warnings:      [],
  }

  for (let i = 0; i < entries.length; i++) {
    try {
      await processClip(entries[i], i, entries.length, summary)
    } catch (err) {
      // Catastrophic failure for this clip — log and continue
      console.log(`FAILED: ${err.message}`)
      summary.errors.push({
        clip: entries[i]?.movieTitle ?? `entry-${i}`,
        phase: 'top-level',
        error: err.message,
      })
    }
    if (i < entries.length - 1) await sleep(DELAY_BETWEEN_CLIPS)
  }

  // ── Summary ────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60))
  console.log(`Clips created:    ${summary.clipsCreated}`)
  console.log(`Clips skipped:    ${summary.skipped}  (already existed)`)
  console.log(`Practice steps:   ${summary.practiceSteps}`)
  console.log(`Demo images:      ${summary.images}`)
  console.log(`Tags created:     ${summary.tags}`)
  console.log(`Hard errors:      ${summary.errors.length}`)
  console.log(`Soft warnings:    ${summary.warnings.length}`)

  if (summary.errors.length > 0) {
    console.log(`\nHard errors (clip not fully created):`)
    summary.errors.forEach((e) =>
      console.log(`  - [${e.phase}] ${e.clip}: ${e.error}`)
    )
  }

  if (summary.warnings.length > 0) {
    console.log(`\nWarnings (clip created but a phase failed):`)
    summary.warnings.slice(0, 30).forEach((w) =>
      console.log(`  - [${w.phase}] ${w.clip}: ${w.error}`)
    )
    if (summary.warnings.length > 30) {
      console.log(`  ... and ${summary.warnings.length - 30} more`)
    }
  }

  console.log()
}

main()
  .catch((err) => {
    console.error('\nFATAL:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
