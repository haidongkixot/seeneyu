/**
 * Auto-Generate Practice Steps from clip data using GPT.
 * Returns generated steps as a preview (NOT saved to DB).
 * Admin reviews/edits, then saves via PUT /api/admin/clips/[id]/steps.
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params

    const clip = await prisma.clip.findUnique({ where: { id } })
    if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 })

    // Build observation moments text
    let momentsText = ''
    if (clip.observationGuide) {
      const guide = clip.observationGuide as any
      const moments = guide.moments ?? []
      momentsText = moments.map((m: any, i: number) =>
        `${i + 1}. At ${m.atSecond}s — ${m.technique}: ${m.what} (Why: ${m.why})`
      ).join('\n')
    }

    const skillLabel = (clip.skillCategory || 'eye-contact').replace(/-/g, ' ')

    const prompt = `You are a body language and communication coach designing a step-by-step practice guide for learners.

Clip context:
- Skill category: ${skillLabel}
- Difficulty: ${clip.difficulty}
- Movie: ${clip.movieTitle}${clip.characterName ? ` (character: ${clip.characterName})` : ''}
- Scene description: ${clip.sceneDescription}
${clip.annotation ? `- Coaching note: ${clip.annotation}` : ''}
${momentsText ? `- Observation guide moments:\n${momentsText}` : ''}
${clip.script ? `- Script excerpt: "${(clip.script as string).slice(0, 400)}"` : ''}

Generate 4-6 practice steps that guide a learner to replicate the ${skillLabel} technique shown in this clip. Each step should:
- Focus on ONE specific micro-technique
- Have a clear, actionable instruction (2-3 sentences that tell the learner exactly what to do with their body)
- Include a brief coaching tip (1 sentence, practical advice)
- Suggest a recording duration between 10-30 seconds
- Include a detailed image prompt (1-2 sentences) describing what a sketch-style illustration of this step should show — focus on body position, facial expression, and posture

Return valid JSON only:
{
  "steps": [
    {
      "stepNumber": 1,
      "skillFocus": "Technique name",
      "instruction": "Do this specific thing...",
      "tip": "Pro tip...",
      "targetDurationSec": 20,
      "imagePrompt": "A sketch of a person..."
    }
  ]
}`

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    let parsed: any

    try {
      parsed = JSON.parse(content)
    } catch {
      // Fallback: try to find JSON in the response
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json({ error: 'Failed to parse GPT response' }, { status: 500 })
      parsed = JSON.parse(match[0])
    }

    const steps = (parsed.steps ?? []).map((s: any, i: number) => ({
      stepNumber: s.stepNumber ?? i + 1,
      skillFocus: String(s.skillFocus ?? ''),
      instruction: String(s.instruction ?? ''),
      tip: s.tip ? String(s.tip) : null,
      targetDurationSec: Number(s.targetDurationSec) || 20,
      imagePrompt: String(s.imagePrompt ?? ''),
    }))

    return NextResponse.json({ steps, clipTitle: clip.movieTitle, skillCategory: clip.skillCategory })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[auto-generate] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
