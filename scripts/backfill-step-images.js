/**
 * backfill-step-images.js
 * Finds practice steps for inactive clips that have no demoImageUrl,
 * generates images via DALL-E 2, uploads to Vercel Blob, saves URL to DB.
 *
 * Usage:
 *   node scripts/backfill-step-images.js
 *   node scripts/backfill-step-images.js --dry   (no writes)
 *
 * Cost: ~$0.018/image (DALL-E 2, 512x512)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { PrismaClient } = require('@prisma/client')
const OpenAI = require('openai').default ?? require('openai')
const { put } = require('@vercel/blob')

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const DRY = process.argv.includes('--dry')

// ── Generate image via DALL-E 2 ───────────────────────────────────────
async function generateImage(prompt) {
  // Sanitize prompt — DALL-E rejects prompts mentioning real people by name
  const safePrompt = `A clean minimalist sketch-style educational illustration: ${prompt}. Simple line drawing, white background, no text, no labels, body language coaching reference.`

  const response = await openai.images.generate({
    model: 'dall-e-2',
    prompt: safePrompt.slice(0, 1000), // DALL-E 2 limit
    n: 1,
    size: '512x512',
    response_format: 'b64_json',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error('DALL-E returned no image data')

  const buffer = Buffer.from(b64, 'base64')
  // Verify non-trivially small
  if (buffer.length < 5000) throw new Error('DALL-E returned suspiciously small image')

  return buffer
}

// ── Upload to Vercel Blob ─────────────────────────────────────────────
async function uploadImage(buffer, clipId, stepNumber) {
  const pathname = `practice-demos-${clipId}/step-${stepNumber}.png`
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: 'image/png',
  })
  return blob.url
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🖼  Step Image Backfill${DRY ? ' [DRY RUN]' : ''} (DALL-E 2)`)
  console.log('─'.repeat(60))

  // Clip IDs that were just generated (inactive, no image, created recently)
  const targetClipIds = [
    'cmn4vdket0000l504bpaho0jq',
    'cmn4vdqht0001l504cg91xjsa',
    'cmn693ipt003djs04uujefnk5',
    'cmn6brz280000l404ptd219ax',
    'cmn6c8jy80000la046dgs8h32',
    'cmn9obk950000jx0402qv9s66',
    'cmna3rz2d0003kz046wpuk62d',
    'cmnalopk30000l804j0fco6vc',
    'cmnfxtpg30004lb04nt5u1cjx',
    'cmnh90db40000l704ekhdywpi',
    'cmnh97nfc0002kw04vivzy3ox',
    'cmnh98cra0003kw04wxeil3d7',
  ]

  // Find steps for those specific clips that have no image
  const steps = await prisma.practiceStep.findMany({
    where: {
      demoImageUrl: null,
      clipId: { in: targetClipIds },
    },
    include: { clip: { select: { id: true, movieTitle: true, skillCategory: true } } },
    orderBy: [{ clipId: 'asc' }, { stepNumber: 'asc' }],
  })

  if (steps.length === 0) {
    console.log('✅ All inactive clip steps already have images.')
    return
  }

  const cost = (steps.length * 0.018).toFixed(2)
  console.log(`Found ${steps.length} steps without images (est. cost: $${cost})\n`)

  let succeeded = 0
  let failed = 0
  const errors = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const label = `${step.clip.movieTitle.slice(0, 30)} — step ${step.stepNumber}`
    process.stdout.write(`  [${i + 1}/${steps.length}] ${label}... `)

    // Build prompt from imagePrompt or fall back to instruction
    const prompt = step.imagePrompt ||
      `A person demonstrating: ${step.instruction} Skill: ${step.clip.skillCategory.replace(/-/g, ' ')}.`

    if (DRY) {
      console.log(`[DRY] would generate: "${prompt.slice(0, 70)}..."`)
      succeeded++
      continue
    }

    try {
      const buffer = await generateImage(prompt)
      const url = await uploadImage(buffer, step.clipId, step.stepNumber)

      await prisma.practiceStep.update({
        where: { id: step.id },
        data: { demoImageUrl: url },
      })

      console.log(`✓ ${Math.round(buffer.length / 1024)}KB`)
      succeeded++

      // Rate limiting: DALL-E 2 allows ~5 req/min on free tier, 50/min on paid
      await new Promise(r => setTimeout(r, 400))
    } catch (err) {
      console.log(`✗ ${err.message.slice(0, 80)}`)
      errors.push({ step: label, error: err.message })
      failed++
      // Back off on error
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Succeeded: ${succeeded}`)
  if (failed > 0) {
    console.log(`❌ Failed:    ${failed}`)
    errors.forEach(e => console.log(`   - ${e.step}: ${e.error}`))
  }

  if (!DRY) {
    const total = await prisma.practiceStep.count({ where: { demoImageUrl: { not: null } } })
    console.log(`\nDB state: ${total} steps now have images`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
