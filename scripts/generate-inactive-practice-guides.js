/**
 * generate-inactive-practice-guides.js
 * Finds inactive clips with 0 practice steps, generates steps via GPT-4o-mini,
 * generates a demo image per step via Pollinations, uploads to Vercel Blob,
 * then saves everything to DB. Bypasses HTTP auth — run locally only.
 *
 * Usage:
 *   node scripts/generate-inactive-practice-guides.js
 *   node scripts/generate-inactive-practice-guides.js --dry      (no DB/Blob writes)
 *   node scripts/generate-inactive-practice-guides.js --no-image (skip image gen)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { PrismaClient } = require('@prisma/client')
const OpenAI = require('openai').default ?? require('openai')
const { put } = require('@vercel/blob')

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const DRY        = process.argv.includes('--dry')
const NO_IMAGE   = process.argv.includes('--no-image')
const CONCURRENCY = 3  // clips processed in parallel

// ── Skill-specific step counts ────────────────────────────────────────
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

// ── Build GPT prompt ──────────────────────────────────────────────────
function buildPrompt(clip) {
  let momentsText = ''
  if (clip.observationGuide) {
    const guide = typeof clip.observationGuide === 'string'
      ? JSON.parse(clip.observationGuide)
      : clip.observationGuide
    const moments = guide.moments ?? []
    momentsText = moments.map((m, i) =>
      `${i + 1}. At ${m.atSecond}s — ${m.technique}: ${m.what} (Why: ${m.why})`
    ).join('\n')
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

// ── Generate steps via GPT ────────────────────────────────────────────
async function generateSteps(clip) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(clip) }],
    response_format: { type: 'json_object' },
    max_tokens: 1800,
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse GPT response')
    parsed = JSON.parse(match[0])
  }

  return (parsed.steps ?? []).map((s, i) => ({
    stepNumber: s.stepNumber ?? i + 1,
    skillFocus: String(s.skillFocus ?? ''),
    instruction: String(s.instruction ?? ''),
    tip: s.tip ? String(s.tip) : null,
    targetDurationSec: Number(s.targetDurationSec) || 20,
    imagePrompt: s.imagePrompt ? String(s.imagePrompt) : null,
    demoImageUrl: null,
    voiceUrl: null,
  }))
}

// ── Generate image via Pollinations + verify ──────────────────────────
async function generateAndVerifyImage(prompt, clipId, stepNumber) {
  const seed = Math.floor(Math.random() * 999999)
  const encoded = encodeURIComponent(prompt)
  const width = 768, height = 768
  const model = 'flux'

  const urls = [
    `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}`,
    `https://pollinations.ai/p/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}`,
  ]

  let buffer = null
  let mimeType = 'image/jpeg'

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      })
      const ct = res.headers.get('content-type') || ''
      if (res.ok && ct.includes('image') && !ct.includes('svg')) {
        const ab = await res.arrayBuffer()
        const buf = Buffer.from(ab)
        // Verify non-trivially small (< 5KB = probably error page)
        if (buf.length > 5000) {
          buffer = buf
          mimeType = ct.split(';')[0].trim()
          break
        }
      }
    } catch { /* try next */ }
  }

  if (!buffer) throw new Error('Pollinations returned no valid image')
  return { buffer, mimeType }
}

// ── Upload to Vercel Blob ─────────────────────────────────────────────
async function uploadImage(buffer, mimeType, clipId, stepNumber) {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg'
  const pathname = `practice-demos-${clipId}/step-${stepNumber}.${ext}`
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: mimeType,
  })
  return blob.url
}

// ── Process a single step's image ─────────────────────────────────────
async function processStepImage(step, clipId) {
  if (!step.imagePrompt) return null
  try {
    const { buffer, mimeType } = await generateAndVerifyImage(step.imagePrompt, clipId, step.stepNumber)
    const url = await uploadImage(buffer, mimeType, clipId, step.stepNumber)
    return url
  } catch (err) {
    process.stdout.write(`\n      ⚠ Image failed (step ${step.stepNumber}): ${err.message}`)
    return null
  }
}

// ── Save steps + images to DB ─────────────────────────────────────────
async function saveSteps(clipId, steps) {
  await prisma.$transaction(
    steps.map((step) =>
      prisma.practiceStep.create({
        data: {
          clipId,
          stepNumber:        step.stepNumber,
          skillFocus:        step.skillFocus,
          instruction:       step.instruction,
          tip:               step.tip,
          targetDurationSec: step.targetDurationSec,
          imagePrompt:       step.imagePrompt,
          demoImageUrl:      step.demoImageUrl,
          voiceUrl:          step.voiceUrl,
        },
      })
    )
  )
}

// ── Process one clip ──────────────────────────────────────────────────
async function processClip(clip, index, total) {
  const label = `${clip.movieTitle.slice(0, 35)} (${clip.skillCategory})`
  process.stdout.write(`  [${index + 1}/${total}] ${label}...\n`)

  // Step 1: Generate text steps
  const steps = await generateSteps(clip)
  process.stdout.write(`    ✓ ${steps.length} steps generated`)

  if (DRY) {
    process.stdout.write(` [DRY — not saved]\n`)
    steps.forEach(s => process.stdout.write(`      Step ${s.stepNumber}: ${s.skillFocus}\n`))
    return { succeeded: true, imagesGenerated: 0 }
  }

  // Step 2: Generate images for each step
  let imagesGenerated = 0
  if (!NO_IMAGE) {
    process.stdout.write(` — generating images...\n`)
    for (const step of steps) {
      process.stdout.write(`      Step ${step.stepNumber} image... `)
      const url = await processStepImage(step, clip.id)
      if (url) {
        step.demoImageUrl = url
        imagesGenerated++
        process.stdout.write(`✓\n`)
      } else {
        process.stdout.write(`✗ (skipped)\n`)
      }
      // Small delay to avoid hammering Pollinations
      await new Promise(r => setTimeout(r, 500))
    }
  } else {
    process.stdout.write(`\n`)
  }

  // Step 3: Save to DB
  await saveSteps(clip.id, steps)
  process.stdout.write(`    ✓ Saved to DB (${imagesGenerated}/${steps.length} with images)\n`)

  return { succeeded: true, imagesGenerated }
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔬 Inactive Clip Practice Guide Generator${DRY ? ' [DRY RUN]' : ''}${NO_IMAGE ? ' [NO IMAGES]' : ''}`)
  console.log('─'.repeat(60))

  const clips = await prisma.clip.findMany({
    where: { isActive: false },
    include: { _count: { select: { practiceSteps: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const missing = clips.filter(c => c._count.practiceSteps === 0)

  if (missing.length === 0) {
    console.log('✅ All inactive clips already have practice guides.')
    return
  }

  console.log(`Found ${missing.length} inactive clips without practice guides:\n`)
  missing.forEach((c, i) =>
    console.log(`  ${i + 1}. [${c.skillCategory}] ${c.movieTitle.slice(0, 50)} — ${c.id}`)
  )
  console.log()

  let succeeded = 0
  let failed = 0
  let totalImages = 0
  const errors = []

  // Process in batches for concurrency
  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const batch = missing.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((clip, j) => processClip(clip, i + j, missing.length))
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const clip = batch[j]
      if (result.status === 'fulfilled') {
        succeeded++
        totalImages += result.value.imagesGenerated
      } else {
        failed++
        const label = `${clip.movieTitle.slice(0, 35)} (${clip.skillCategory})`
        errors.push({ clip: label, error: result.reason?.message })
        console.log(`  ✗ FAILED: ${label} — ${result.reason?.message}`)
      }
    }

    // Delay between batches to avoid API rate limits
    if (i + CONCURRENCY < missing.length) {
      await new Promise(r => setTimeout(r, 1200))
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Succeeded: ${succeeded} clips`)
  console.log(`🖼  Images:    ${totalImages} generated & uploaded`)
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`)
    errors.forEach(e => console.log(`   - ${e.clip}: ${e.error}`))
  }
  console.log()

  if (!DRY && succeeded > 0) {
    const total = await prisma.practiceStep.count()
    const clipsWithSteps = await prisma.clip.count({
      where: { practiceSteps: { some: {} } }
    })
    const stepsWithImages = await prisma.practiceStep.count({
      where: { demoImageUrl: { not: null } }
    })
    console.log(`DB state: ${clipsWithSteps} clips with steps, ${total} total steps, ${stepsWithImages} with images`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
