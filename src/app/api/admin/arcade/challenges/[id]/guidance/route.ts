/**
 * Auto-generate + manage guidance steps for an Arcade challenge.
 *
 * POST — generate guidance steps via GPT (preview only, saves to DB)
 * PUT  — update guidance steps manually
 * DELETE — remove guidance steps
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/** POST — auto-generate guidance steps from challenge data */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params

    const challenge = await (prisma as any).arcadeChallenge.findUnique({
      where: { id: id },
      include: { bundle: { select: { title: true } } },
    })
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })

    const prompt = `You are a body language coach creating step-by-step guidance for a ${challenge.type} expression challenge.

Challenge: "${challenge.title}"
Description: ${challenge.description}
Context: ${challenge.context}
Difficulty: ${challenge.difficulty}
Bundle: ${challenge.bundle.title}

Generate 3-5 short guidance steps that help a learner perform this ${challenge.type === 'facial' ? 'facial expression' : 'body gesture'} correctly. Each step should:
- Focus on ONE specific muscle group or body movement
- Be actionable and specific (e.g., "Raise your inner eyebrows by engaging the frontalis muscle")
- Include a brief tip
- Include an image prompt for a sketch illustration

Return valid JSON only:
{
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "...",
      "tip": "...",
      "imagePrompt": "A sketch of a person..."
    }
  ]
}`

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    let parsed: any
    try { parsed = JSON.parse(content) } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json({ error: 'Failed to parse GPT response' }, { status: 500 })
      parsed = JSON.parse(match[0])
    }

    const steps = (parsed.steps ?? []).map((s: any, i: number) => ({
      stepNumber: s.stepNumber ?? i + 1,
      instruction: String(s.instruction ?? ''),
      tip: s.tip ? String(s.tip) : null,
      imageUrl: null,
      voiceUrl: null,
      imagePrompt: String(s.imagePrompt ?? ''),
    }))

    // Save to DB
    await (prisma as any).arcadeChallenge.update({
      where: { id: id },
      data: { guidanceSteps: steps },
    })

    return NextResponse.json({ steps })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** PUT — update guidance steps */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { steps } = await req.json()

    await (prisma as any).arcadeChallenge.update({
      where: { id: id },
      data: { guidanceSteps: steps },
    })

    return NextResponse.json({ ok: true, steps })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** DELETE — remove guidance steps */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params

    await (prisma as any).arcadeChallenge.update({
      where: { id: id },
      data: { guidanceSteps: null },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
