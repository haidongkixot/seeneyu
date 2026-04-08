import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { scoreFullPerformanceFromAnalysis, combineVisualAndVoiceScores } from '@/services/expression-scorer'
import { generateTextFeedback, getVoiceTips } from '@/services/feedback-generator'
import { shouldStoreRecording } from '@/services/consent-manager'
import { analyzeVoice } from '@/services/voice-analyzer'
import { computeHolisticScore, scoreSnapshot } from '@/services/holistic-scorer'
import { getVoiceAccess, getHolisticBreakdownAccess, getTemporalAccess } from '@/lib/access-control'
import { fireEmailTrigger } from '@/engine/learning-assistant/triggers/email-triggers'
import type { VoiceMetrics } from '@/services/voice-analyzer'
import type { FeedbackResult } from '@/lib/types'
import type { AnalysisSnapshot } from '@/lib/mediapipe-types'

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })

const SKILL_DIMENSIONS: Record<string, string[]> = {
  'eye-contact':            ['Gaze Duration', 'Break Direction', 'Eye Opening', 'Consistency'],
  'open-posture':           ['Chest Openness', 'Arm Position', 'Stance Width', 'Spine Alignment'],
  'active-listening':       ['Forward Lean', 'Nod Timing', 'Facial Mirroring', 'Stillness'],
  'vocal-pacing':           ['Pause Timing', 'Tempo Variation', 'Volume Range', 'Rhythm Control'],
  'confident-disagreement': ['Posture Stability', 'Eye Contact Hold', 'Voice Steadiness', 'Open Body'],
  'hand-gestures':          ['Hand Openness', 'Gesture Variety', 'Hand Positioning', 'Movement Flow'],
}

interface ClipContext {
  skillCategory: string
  annotation: string
  characterName: string | null
  actorName: string | null
  movieTitle: string
  sceneDescription: string
  script?: string | null
}

function buildPrompt(clip: ClipContext, dimensions: string[]): string {
  const characterLine = clip.characterName
    ? `The learner was mimicking ${clip.characterName}${clip.actorName ? ` (${clip.actorName})` : ''} from ${clip.movieTitle}.`
    : `The learner was practicing a scene from ${clip.movieTitle}.`

  const scriptLine = clip.script
    ? `\nScript/dialogue they were asked to perform: "${clip.script}"`
    : ''

  return `You are an expert body language and communication coach analyzing a user's practice recording.

${characterLine}
Scene: ${clip.sceneDescription}${scriptLine}

The user was practicing: ${clip.skillCategory.replace('-', ' ')}
Reference behavior: ${clip.annotation}

Analyze the recording provided. Score the user on these 4 dimensions (0-10 each):
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
  "steps": [
    { "number": 1, "action": "<specific physical action, imperative>", "why": "<1 sentence reason>" },
    { "number": 2, "action": "<specific physical action, imperative>", "why": "<1 sentence reason>" },
    { "number": 3, "action": "<specific physical action, imperative>", "why": "<1 sentence reason>" }
  ],
  "tips": [
    { "title": "<short tip title>", "body": "<2-3 sentence actionable tip>" },
    { "title": "<short tip title>", "body": "<2-3 sentence actionable tip>" },
    { "title": "<short tip title>", "body": "<2-3 sentence actionable tip>" }
  ]
}

Steps should be 3-5 ordered by priority (highest impact first). Be specific — reference what you actually see. Be encouraging but honest.`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await prisma.userSession.findUnique({
      where: { id },
      include: {
        clip: {
          include: {
            practiceSteps: {
              orderBy: { stepNumber: 'asc' },
              select: { stepNumber: true, skillFocus: true, instruction: true, tip: true },
            },
          },
        },
        user: { select: { plan: true } },
      },
    })

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!session.recordingUrl) return NextResponse.json({ error: 'No recording' }, { status: 400 })

    await prisma.userSession.update({ where: { id }, data: { status: 'feedback_pending' } })

    const startMs = Date.now()

    // ── MediaPipe path: client-side analysis data in POST body ──
    let analysisSnapshots: AnalysisSnapshot[] | null = null
    let analysisSkillCategory: string | null = null
    let recordingDurationSec: number | null = null  // I2: feedforward peak detection
    try {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const body = await req.json()
        if (body.analysisData?.snapshots) {
          analysisSnapshots = body.analysisData.snapshots
          analysisSkillCategory = body.analysisData.skillCategory || null
        }
        if (typeof body.recordingDurationSec === 'number') {
          recordingDurationSec = body.recordingDurationSec
        }
      }
    } catch { /* not JSON body — use legacy path */ }

    if (analysisSnapshots && analysisSnapshots.length > 0) {
      const skill = analysisSkillCategory || session.clip.skillCategory
      const userPlan = (session.user as any)?.plan ?? 'basic'

      // Voice analysis: only run for standard+ (saves server CPU for free users)
      let voiceMetrics: VoiceMetrics | null = null
      const voiceAccess = getVoiceAccess(userPlan)
      if (voiceAccess !== 'none' && session.recordingUrl) {
        try {
          voiceMetrics = await analyzeVoice(session.recordingUrl)
        } catch (err) {
          console.warn('[feedback] voice analysis failed (non-blocking):', (err as Error).message)
        }
      }

      // Holistic scoring: visual (face+pose+hands) + temporal + voice
      const holistic = computeHolisticScore(analysisSnapshots, skill, voiceMetrics)
      const metrics = holistic.visualMetrics
      metrics.overallScore = holistic.composite // use blended score

      // I2: Compute per-snapshot scores for feedforward peak detection
      const duration = recordingDurationSec || (analysisSnapshots.length * 0.5) // estimate if not provided
      const snapshotScores = analysisSnapshots.map((snap, i) => ({
        sec: Math.round(((i / Math.max(analysisSnapshots!.length - 1, 1)) * duration) * 100) / 100,
        score: scoreSnapshot(snap, skill),
      }))

      // Parse observation guide if stored as string
      let observationGuide: any = (session.clip as any).observationGuide ?? null
      if (typeof observationGuide === 'string') {
        try { observationGuide = JSON.parse(observationGuide) } catch { observationGuide = null }
      }

      const clipCtx = {
        skillCategory: session.clip.skillCategory,
        characterName: session.clip.characterName,
        actorName: (session.clip as any).actorName ?? null,
        movieTitle: session.clip.movieTitle,
        sceneDescription: session.clip.sceneDescription,
        script: (session.clip as any).script ?? null,
        annotation: session.clip.annotation,
        observationGuide,
        practiceSteps: (session.clip as any).practiceSteps ?? null,
      }
      const textFeedback = await generateTextFeedback(metrics, clipCtx)

      // Append voice tips only for standard+ with successful voice analysis
      if (voiceAccess !== 'none' && voiceMetrics && voiceMetrics.voiceScore > 0) {
        const vTips = getVoiceTips(skill)
        if (vTips.length > 0) textFeedback.tips = [...(textFeedback.tips ?? []), ...vTips]
      }

      // Find next clip
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

      // Build holistic breakdown — gated by plan
      const temporalAccess = getTemporalAccess(userPlan)
      const showHolistic = getHolisticBreakdownAccess(userPlan)

      const feedback: FeedbackResult = {
        ...textFeedback,
        nextClipId,
        processingMs: Date.now() - startMs,
        // Holistic breakdown: advanced gets full, others get nothing (score still benefits from holistic math)
        ...(showHolistic ? {
          holisticBreakdown: {
            visual: holistic.visual,
            temporal: temporalAccess !== 'none' ? holistic.temporal : { smoothness: 0, rhythm: 0, variety: 0 },
            voice: voiceAccess === 'full' && voiceMetrics ? {
              pitchVariation: voiceMetrics.pitchVariation,
              speakingRate: voiceMetrics.speakingRate,
              volumeDynamics: voiceMetrics.volumeDynamics,
              voiceScore: voiceMetrics.voiceScore,
            } : null,
          },
        } : {}),
      }

      // I3: Compute nextReviewAt based on score
      const reviewScore = feedback.overallScore ?? 0
      const reviewDays = reviewScore < 50 ? 1 : reviewScore < 70 ? 3 : reviewScore < 85 ? 7 : 21
      const nextReviewAt = new Date(Date.now() + reviewDays * 86400000)

      await prisma.userSession.update({
        where: { id },
        data: {
          status: 'complete',
          feedback: JSON.parse(JSON.stringify(feedback)),
          scores: JSON.parse(JSON.stringify({ overallScore: feedback.overallScore, dimensions: feedback.dimensions })),
          completedAt: new Date(),
          // I2: Persist per-snapshot scores for feedforward
          snapshotScores: JSON.parse(JSON.stringify(snapshotScores)),
          recordingDurationSec: recordingDurationSec ? Math.round(recordingDurationSec) : null,
          // I3: Schedule spaced review
          nextReviewAt,
          reviewCount: { increment: 1 },
        },
      })

      // Fire feedback_ready email (non-blocking)
      if (session.userId) {
        const baseUrl = process.env.NEXTAUTH_URL || 'https://seeneyu.vercel.app'
        fireEmailTrigger('feedback_ready', session.userId, {
          clipTitle: session.clip.movieTitle,
          score: feedback.overallScore,
          feedbackUrl: `${baseUrl}/feedback/${id}`,
        }).catch(() => {})
      }

      // If user opted out of data storage, delete recording blobs (keep scores/feedback)
      if (session.userId) {
        const keep = await shouldStoreRecording(session.userId)
        if (!keep) {
          if (session.recordingUrl) del(session.recordingUrl).catch(() => {})
          if (session.frameUrls) {
            for (const url of JSON.parse(session.frameUrls as string)) del(url).catch(() => {})
          }
          prisma.userSession.update({
            where: { id },
            data: { recordingUrl: null, recordingKey: null, frameUrls: null },
          }).catch(() => {})
        }
      }

      // Log analysis metric (fire-and-forget)
      ;(prisma as any).analysisMetric.create({
        data: {
          sessionType: 'full_performance',
          durationMs: Date.now() - startMs,
          faceDetected: analysisSnapshots.some((s: any) => s.faceDetected),
          poseDetected: analysisSnapshots.some((s: any) => s.poseLandmarks),
          snapshotCount: analysisSnapshots.length,
          score: feedback.overallScore,
        },
      }).catch(() => {})

      return NextResponse.json({ feedback })
    }

    // ── Legacy GPT-4o Vision path (fallback) ──

    const dimensions = SKILL_DIMENSIONS[session.clip.skillCategory] ?? SKILL_DIMENSIONS['eye-contact']
    const clipCtx: ClipContext = { ...session.clip, script: (session.clip as any).script ?? null }
    const prompt = buildPrompt(clipCtx, dimensions)

    const frameUrls: string[] = session.frameUrls ? JSON.parse(session.frameUrls as string) : []
    const hasFrames = frameUrls.length > 0

    const messageContent = hasFrames
      ? [
          { type: 'text' as const, text: prompt },
          ...frameUrls.map((url) => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'low' as const },
          })),
        ]
      : [{ type: 'text' as const, text: prompt + '\n\n(No video frames available — evaluate based on context and provide general coaching guidance.)' }]

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: messageContent }],
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
      steps: parsed.steps ?? [],
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

    // If user opted out of data storage, delete recording blobs
    if (session.userId) {
      const keep = await shouldStoreRecording(session.userId)
      if (!keep) {
        if (session.recordingUrl) del(session.recordingUrl).catch(() => {})
        if (session.frameUrls) {
          for (const url of JSON.parse(session.frameUrls as string)) del(url).catch(() => {})
        }
        prisma.userSession.update({
          where: { id },
          data: { recordingUrl: null, recordingKey: null, frameUrls: null },
        }).catch(() => {})
      }
    }

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
