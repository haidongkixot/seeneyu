/**
 * Diagnose why feedback failed for a specific session.
 * Usage: npx tsx scripts/diagnose-feedback.ts <sessionId>
 */
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const SESSION_ID = process.argv[2] || 'cmn18i5rq0001la04d3lcpfhb'

async function main() {
  const prisma = new PrismaClient()

  // 1. Load session
  const session = await prisma.userSession.findUnique({
    where: { id: SESSION_ID },
    include: { clip: true },
  })
  if (!session) { console.error('Session not found'); process.exit(1) }

  console.log('Session:', {
    id: session.id, status: session.status,
    clip: session.clip.movieTitle, skill: session.clip.skillCategory,
  })

  // 2. Check frames
  const frameUrls: string[] = session.frameUrls ? JSON.parse(session.frameUrls as string) : []
  console.log(`\nFrames: ${frameUrls.length}`)
  for (const url of frameUrls) {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      console.log(`  ${res.status} ${res.ok ? 'OK' : 'FAIL'} — ${url.slice(0, 80)}...`)
    } catch (e: any) {
      console.log(`  FETCH ERROR — ${e.message}`)
    }
  }

  if (frameUrls.length === 0) {
    console.error('\nNo frames — cannot call Vision API.')
    await prisma.$disconnect(); return
  }

  // 3. Try OpenAI call
  const key = process.env.OPENAI_API_KEY
  if (!key) { console.error('\nOPENAI_API_KEY not set'); await prisma.$disconnect(); return }

  console.log('\nCalling GPT-4o Vision...')
  const openai = new OpenAI({ apiKey: key })
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Test: describe what you see in this image in one sentence.` },
          { type: 'image_url', image_url: { url: frameUrls[0], detail: 'low' } },
        ],
      }],
    })
    console.log('  OpenAI OK:', response.choices[0]?.message?.content?.slice(0, 100))
    console.log('  Model:', response.model)
    console.log('\nDiagnosis: OpenAI call works. Retrying full feedback now...')

    // 4. Reset and re-run
    await prisma.userSession.update({ where: { id: SESSION_ID }, data: { status: 'uploaded' } })
    console.log('Session reset to "uploaded". Trigger feedback via:')
    console.log(`  curl -X POST http://localhost:3000/api/sessions/${SESSION_ID}/feedback`)

  } catch (e: any) {
    console.error('\nOpenAI ERROR:', e.message)
    if (e.status === 401) console.error('  → Invalid or expired OPENAI_API_KEY')
    if (e.status === 429) console.error('  → Rate limit or quota exceeded')
    if (e.status === 404) console.error('  → Model not found (no gpt-4o access on this key?)')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
