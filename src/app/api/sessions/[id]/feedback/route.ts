import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { FeedbackResult } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SKILL_DIMENSIONS: Record<string, string[]> = {
  'eye-contact':            ['Gaze Duration', 'Break Direction', 'Eye Opening', 'Consistency'],
  'open-posture':           ['Chest Openness', 'Arm Position', 'Stance Width', 'Spine Alignment'],
  'active-listening':       ['Forward Lean', 'Nod Timing', 'Facial Mirroring', 'Stillness'],
  'vocal-pacing':           ['Pause Timing', 'Tempo Variation', 'Volume Range', 'Rhythm Control'],
  'confident-disagreement': ['Posture Stability', 'Eye Contact Hold', 'Voice Steadiness', 'Open Body'],
}

function buildPrompt(skillCategory: string, annotation: string, dimensions: string[]): string {
  return `You are an expert body language and communication coach analyzing a user's practice recording.

The user was practicing: ${skillCategory.replace('-', ' ')}
Reference behavior: ${annotation}

Analyze the video recording provided. Score the user on these 4 dimensions (0-10 each):
${dimensions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Return a JSON object with EXACTLY this structure:
{
  "overallScore": <0-100, weighted average>,
  "summary": "<one sentence, specific and encouraging>",
  "dimensions": [
    { "label": "${dimensions[0]}", "score": <0-10> },
    { "label": "${dimensions[1]}", "score": <0-10> },
    { "label": "${dimensions[2]}", "score": <0-10> },
    { "label": "${dimensions[3]}", "score": <0-10> }
  ],
  "positives": ["<specific thing 1>", "<specific thing 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "tips": [
    { "title": "<short tip title>", "body": "<2-3 sentence actionable tip>" },
    { "title": "<short tip title>", "body": "<2-3 sentence actionable tip>" },
    { "title": "<short tip title>", "body": "<2-3 sentence actionable tip>" }
  ]
}

Be specific — reference what you actually see in the video. Be encouraging but honest.`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await prisma.userSession.findUnique({
      where: { id },
      include: { clip: true },
    })

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!session.recordingUrl) return NextResponse.json({ error: 'No recording' }, { status: 400 })
    if (!session.frameUrls) return NextResponse.json({ error: 'No frames captured for analysis' }, { status: 422 })

    await prisma.userSession.update({ where: { id }, data: { status: 'feedback_pending' } })

    const dimensions = SKILL_DIMENSIONS[session.clip.skillCategory] ?? SKILL_DIMENSIONS['eye-contact']
    const prompt = buildPrompt(session.clip.skillCategory, session.clip.annotation, dimensions)

    // GPT-4o Vision requires images, not video.
    // Frame snapshots were captured client-side during recording and stored in Vercel Blob.
    const frameUrls: string[] = session.frameUrls ? JSON.parse(session.frameUrls as string) : []

    if (frameUrls.length === 0) {
      // No frames captured — cannot analyze
      await prisma.userSession.update({ where: { id }, data: { status: 'failed' } })
      return NextResponse.json({ error: 'No frame images available for analysis' }, { status: 422 })
    }

    const startMs = Date.now()

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            // Send up to 4 frames — each is a JPEG snapshot from the recording
            ...frameUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url, detail: 'low' as const },
            })),
          ],
        },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in GPT response')

    const parsed = JSON.parse(jsonMatch[0]) as Omit<FeedbackResult, 'nextClipId' | 'modelUsed' | 'processingMs'>

    // Find next clip (same skill, next difficulty)
    const currentDiff = session.clip.difficulty
    const nextDiff = currentDiff === 'beginner' ? 'intermediate'
      : currentDiff === 'intermediate' ? 'advanced' : null

    let nextClipId: string | undefined
    if (nextDiff) {
      const nextClip = await prisma.clip.findFirst({
        where: { skillCategory: session.clip.skillCategory, difficulty: nextDiff, isActive: true },
        select: { id: true },
      })
      nextClipId = nextClip?.id
    }

    const feedback: FeedbackResult = {
      ...parsed,
      nextClipId,
      modelUsed: 'gpt-4o',
      processingMs: Date.now() - startMs,
    }

    await prisma.userSession.update({
      where: { id },
      data: {
        status: 'complete',
        feedback: JSON.parse(JSON.stringify(feedback)),
        scores: JSON.parse(JSON.stringify({ overallScore: feedback.overallScore, dimensions: feedback.dimensions })),
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Feedback generation error:', error)
    await prisma.userSession.update({ where: { id }, data: { status: 'failed' } }).catch(() => {})
    return NextResponse.json({ error: 'Feedback generation failed' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await prisma.userSession.findUnique({
    where: { id },
    select: { status: true, feedback: true, scores: true },
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}
