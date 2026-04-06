/**
 * auto-tag-clips.js
 * AI-tags all clips in the database with genre, purpose, and character trait tags
 * using GPT-4o-mini. Creates ClipTag records for the Personalized Learning Curve feature.
 *
 * Usage: node scripts/auto-tag-clips.js
 * Dry run:  node scripts/auto-tag-clips.js --dry
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { PrismaClient } = require('@prisma/client')
const OpenAI = require('openai').default ?? require('openai')

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const DRY = process.argv.includes('--dry')

// ── Valid tag values ─────────────────────────────────────────────
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

// ── Build classification prompt ──────────────────────────────────
function buildPrompt(clip) {
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

// ── Call GPT-4o-mini for classification ──────────────────────────
async function classifyClip(clip) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(clip) }],
    response_format: { type: 'json_object' },
    max_tokens: 600,
    temperature: 0.3,
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

  return parsed
}

// ── Validate and build tag records ───────────────────────────────
function buildTagRecords(clipId, classification) {
  const records = []

  const categories = [
    { key: 'genres', category: 'genre', valid: VALID_GENRES },
    { key: 'purposes', category: 'purpose', valid: VALID_PURPOSES },
    { key: 'traits', category: 'trait', valid: VALID_TRAITS },
  ]

  for (const { key, category, valid } of categories) {
    const items = classification[key] ?? []
    for (const item of items) {
      const value = String(item.value).toLowerCase().trim()
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0.5

      if (!valid.includes(value)) {
        console.log(`      [SKIP] Invalid ${category} value: "${value}"`)
        continue
      }

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

// ── Save tags to DB (atomic per clip) ────────────────────────────
async function saveTags(clipId, records) {
  await prisma.$transaction(
    records.map((tag) =>
      prisma.clipTag.create({ data: tag })
    )
  )
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏷️  Auto Tag Clips${DRY ? ' [DRY RUN]' : ''}`)
  console.log('─'.repeat(55))

  // Load ALL clips (active and inactive), with tag count
  const clips = await prisma.clip.findMany({
    include: { _count: { select: { tags: true } } },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Total clips in database: ${clips.length}`)

  // Filter to clips without tags
  const untagged = clips.filter(c => c._count.tags === 0)

  if (untagged.length === 0) {
    console.log('All clips already have tags. Nothing to do.')
    return
  }

  const alreadyTagged = clips.length - untagged.length
  if (alreadyTagged > 0) {
    console.log(`Skipping ${alreadyTagged} clips that already have tags.`)
  }
  console.log(`Processing ${untagged.length} clips...\n`)

  let succeeded = 0
  let failed = 0
  let totalTags = 0
  const errors = []

  for (let i = 0; i < untagged.length; i++) {
    const clip = untagged[i]
    const label = `${clip.movieTitle.slice(0, 40)}${clip.characterName ? ` (${clip.characterName})` : ''}`
    process.stdout.write(`  [${i + 1}/${untagged.length}] ${label}... `)

    try {
      const classification = await classifyClip(clip)
      const records = buildTagRecords(clip.id, classification)

      if (records.length === 0) {
        console.log('(no valid tags returned)')
        failed++
        errors.push({ clip: label, error: 'GPT returned no valid tags' })
        continue
      }

      if (DRY) {
        console.log(`[DRY] ${records.length} tags:`)
        for (const r of records) {
          const icon = r.source === 'ai-confirmed' ? 'C' : 'A'
          console.log(`      [${icon}] ${r.category}:${r.value} (${r.confidence.toFixed(2)})`)
        }
      } else {
        await saveTags(clip.id, records)
        console.log(`${records.length} tags saved`)
      }

      totalTags += records.length
      succeeded++

      // Polite delay between API calls
      if (i < untagged.length - 1) {
        await new Promise(r => setTimeout(r, 800))
      }
    } catch (err) {
      console.log(`FAILED: ${err.message}`)
      errors.push({ clip: label, error: err.message })
      failed++
    }
  }

  // ── Summary ──────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55))
  console.log(`Succeeded: ${succeeded}`)
  console.log(`Failed:    ${failed}`)
  console.log(`Total tags ${DRY ? 'generated' : 'created'}: ${totalTags}`)

  if (errors.length > 0) {
    console.log(`\nErrors:`)
    errors.forEach(e => console.log(`  - ${e.clip}: ${e.error}`))
  }

  if (!DRY && succeeded > 0) {
    // Verify final state
    const tagCount = await prisma.clipTag.count()
    const taggedClips = await prisma.clip.count({
      where: { tags: { some: {} } },
    })
    console.log(`\nDB state: ${taggedClips} clips tagged, ${tagCount} total ClipTag records`)
  }

  console.log()
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
