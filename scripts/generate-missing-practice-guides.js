/**
 * generate-missing-practice-guides.js
 * Finds all clips with 0 practice steps and generates them via GPT-4o-mini,
 * then saves directly to DB. Bypasses HTTP auth — run locally only.
 *
 * Usage: node scripts/generate-missing-practice-guides.js
 * Optional dry-run (no DB writes): node scripts/generate-missing-practice-guides.js --dry
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { PrismaClient } = require('@prisma/client')
const OpenAI = require('openai').default ?? require('openai')

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const DRY = process.argv.includes('--dry')

// ── Skill-specific step counts ────────────────────────────────────
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

// ── Build prompt (same logic as the admin API route) ──────────────
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

// ── Generate steps for one clip ───────────────────────────────────
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

// ── Save steps to DB ──────────────────────────────────────────────
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
          demoImageUrl:      step.demoImageUrl,
          voiceUrl:          step.voiceUrl,
        },
      })
    )
  )
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔬 Practice Guide Generator${DRY ? ' [DRY RUN]' : ''}`)
  console.log('─'.repeat(50))

  // Find clips with no practice steps
  const clips = await prisma.clip.findMany({
    where: { isActive: true },
    include: { _count: { select: { practiceSteps: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const missing = clips.filter(c => c._count.practiceSteps === 0)

  if (missing.length === 0) {
    console.log('✅ All clips already have practice guides.')
    return
  }

  console.log(`Found ${missing.length} clips without practice guides:\n`)
  missing.forEach((c, i) =>
    console.log(`  ${i + 1}. [${c.skillCategory}] ${c.movieTitle.slice(0, 40)} — ${c.id}`)
  )
  console.log()

  let succeeded = 0
  let failed = 0
  const errors = []

  for (let i = 0; i < missing.length; i++) {
    const clip = missing[i]
    const label = `${clip.movieTitle.slice(0, 35)} (${clip.skillCategory})`
    process.stdout.write(`  [${i + 1}/${missing.length}] Generating: ${label}... `)

    try {
      const steps = await generateSteps(clip)

      if (DRY) {
        console.log(`✓ [DRY] ${steps.length} steps generated (not saved)`)
        steps.forEach(s => console.log(`      Step ${s.stepNumber}: ${s.skillFocus}`))
      } else {
        await saveSteps(clip.id, steps)
        console.log(`✓ ${steps.length} steps saved`)
      }

      succeeded++

      // Polite delay between API calls
      if (i < missing.length - 1) {
        await new Promise(r => setTimeout(r, 800))
      }
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`)
      errors.push({ clip: label, error: err.message })
      failed++
    }
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Succeeded: ${succeeded}`)
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`)
    errors.forEach(e => console.log(`   - ${e.clip}: ${e.error}`))
  }
  console.log()

  if (!DRY && succeeded > 0) {
    // Verify final count
    const total = await prisma.practiceStep.count()
    const clipsWithSteps = await prisma.clip.count({
      where: { practiceSteps: { some: {} } }
    })
    console.log(`DB state: ${clipsWithSteps} clips with practice steps, ${total} total steps`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
