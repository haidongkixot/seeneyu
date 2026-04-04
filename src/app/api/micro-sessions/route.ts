import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import OpenAI from 'openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 60
import { prisma } from '@/lib/prisma'
import { scoreMicroPracticeFromAnalysis, combineVisualAndVoiceScores } from '@/services/expression-scorer'
import { shouldStoreRecording } from '@/services/consent-manager'
import { analyzeVoice } from '@/services/voice-analyzer'
import { getVoiceAccess } from '@/lib/access-control'
import type { MicroFeedback } from '@/lib/types'
import type { AnalysisSnapshot } from '@/lib/mediapipe-types'

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })

const VOCAL_SKILLS = new Set(['vocal-pacing', 'confident-disagreement'])

function buildMicroPrompt(
  skillFocus: string,
  instruction: string,
  transcript: string | null
): string {
  const transcriptLine = transcript
    ? `\nLearner's speech transcript: "${transcript}"`
    : ''

  return `You are an expert body language coach analyzing a student's practice attempt.

The student was practicing: ${skillFocus}
Target technique: ${instruction}${transcriptLine}

Analyze their performance with SPECIFIC, ACTIONABLE feedback. You MUST be precise about what you observe — never give generic praise like "great job" without naming exactly what was done well.

Return a JSON object with EXACTLY this structure:
{
  "verdict": "pass" or "needs-work",
  "headline": "<10 words max — specific verdict, e.g. 'Strong eye contact but jaw tension needs work'>",
  "detail": "<2-3 sentences — describe exactly what you observed in their expression, posture, and movement>",
  "scores": [
    { "label": "Facial expression accuracy", "score": <0-100> },
    { "label": "Body posture alignment", "score": <0-100> },
    { "label": "Timing and naturalness", "score": <0-100> },
    { "label": "Eye contact quality", "score": <0-100> }
  ],
  "positives": [
    "<specific observation about what matched the target — name exact body parts/movements>",
    "<another specific positive — e.g. 'Your eyebrow raise was well-timed at the peak moment'>"
  ],
  "improvements": [
    "<specific correction — name the exact muscle group or body part and what should change>",
    "<another correction — e.g. 'Try widening your eyes more while keeping your jaw relaxed'>"
  ],
  "actionableTip": "<one concrete exercise to try right now — e.g. 'Practice raising only your eyebrows without moving your mouth for 5 seconds'>",
  "nextStep": "<what to practice next to build on this skill>"
}

Scoring guide:
- A "pass" verdict requires average score >= 70
- Score 80-100: Excellent technique, minor polish needed
- Score 60-79: Good foundation, specific adjustments needed
- Score 40-59: Developing, focus on fundamentals
- Score below 40: Needs significant practice on basics

Be encouraging but HONEST. Reference specific facial muscles (orbicularis oculi, zygomaticus, frontalis), body positions (shoulder rotation, spine alignment, weight distribution), and timing. Never use filler phrases like "keep practicing" or "you're doing great" without concrete specifics.`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const recording = formData.get('recording') as File | null
    const clipId = formData.get('clipId') as string | null
    const stepNumberRaw = formData.get('stepNumber') as string | null
    const skillFocus = formData.get('skillFocus') as string | null
    const instruction = formData.get('instruction') as string | null
    const skillCategory = formData.get('skillCategory') as string | null

    if (!recording || !clipId || !stepNumberRaw || !skillFocus || !instruction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const stepNumber = parseInt(stepNumberRaw, 10)
    const ts = Date.now()

    // Upload recording
    const blob = await put(`micro/${clipId}/step${stepNumber}/${ts}.webm`, recording, {
      access: 'public',
      contentType: 'video/webm',
    })

    // Upload frames (up to 4)
    const frameUrls: string[] = []
    for (let i = 0; i < 4; i++) {
      const frame = formData.get(`frame_${i}`) as File | null
      if (!frame) break
      const frameBlob = await put(`micro/${clipId}/step${stepNumber}/${ts}_f${i}.jpg`, frame, {
        access: 'public',
        contentType: 'image/jpeg',
      })
      frameUrls.push(frameBlob.url)
    }

    // Create micro session record
    const microSession = await prisma.microSession.create({
      data: {
        clipId,
        stepNumber,
        recordingUrl: blob.url,
        frameUrls: frameUrls.length > 0 ? JSON.stringify(frameUrls) : null,
        status: 'processing',
      },
    })

    // ── MediaPipe path: client-side analysis data available ──
    const analysisDataRaw = formData.get('analysisData') as string | null
    if (analysisDataRaw) {
      try {
        const { snapshots } = JSON.parse(analysisDataRaw) as { snapshots: AnalysisSnapshot[] }
        if (snapshots && snapshots.length > 0) {
          const skill = skillCategory || 'eye-contact'
          const result = scoreMicroPracticeFromAnalysis(skill, skillFocus, instruction, snapshots)

          // Voice analysis for vocal skills — gated by plan (standard+)
          const authSess = await getServerSession(authOptions)
          const userPlan = (authSess?.user as any)?.plan ?? 'basic'
          const voiceAccess = getVoiceAccess(userPlan)
          const VOCAL_SKILL_SET = new Set(['vocal-pacing', 'confident-disagreement'])
          if (voiceAccess !== 'none' && VOCAL_SKILL_SET.has(skill) && blob.url) {
            try {
              const voiceMetrics = await analyzeVoice(blob.url)
              if (voiceMetrics.voiceScore > 0 && result.score !== undefined) {
                result.score = combineVisualAndVoiceScores(result.score, voiceMetrics.voiceScore, skill)
                result.verdict = result.score >= 70 ? 'pass' : 'needs-work'
              }
            } catch (err) {
              console.warn('[micro] voice analysis failed (non-blocking):', (err as Error).message)
            }
          }

          const feedback: MicroFeedback = {
            verdict: result.verdict,
            headline: result.headline,
            detail: result.detail,
            scores: result.scores,
            positives: result.positives,
            improvements: result.improvements,
            actionableTip: result.actionableTip,
            nextStep: result.nextStep,
          }
          await prisma.microSession.update({
            where: { id: microSession.id },
            data: {
              feedback: JSON.parse(JSON.stringify(feedback)),
              status: 'complete',
            },
          })

          // If user opted out of data storage, delete recording blobs (keep feedback)
          const authSession = await getServerSession(authOptions)
          const authUserId = (authSession?.user as any)?.id as string | undefined
          if (authUserId) {
            const keep = await shouldStoreRecording(authUserId)
            if (!keep) {
              del(blob.url).catch(() => {})
              for (const url of frameUrls) del(url).catch(() => {})
              prisma.microSession.update({
                where: { id: microSession.id },
                data: { recordingUrl: null },
              }).catch(() => {})
            }
          }

          // Log analysis metric (fire-and-forget)
          ;(prisma as any).analysisMetric.create({
            data: {
              sessionType: 'micro',
              durationMs: Date.now() - ts,
              faceDetected: snapshots.some((s: any) => s.faceDetected),
              poseDetected: snapshots.some((s: any) => s.poseLandmarks),
              snapshotCount: snapshots.length,
              score: result.verdict === 'pass' ? 80 : 40,
            },
          }).catch(() => {})

          return NextResponse.json({ microSessionId: microSession.id, ...feedback })
        }
      } catch (e) {
        console.warn('MediaPipe analysis parse error, falling back to Vision:', e)
      }
    }

    // ── Legacy GPT-4o Vision path (fallback) ──

    // Transcribe audio for vocal/speech skills
    let transcript: string | null = null
    if (skillCategory && VOCAL_SKILLS.has(skillCategory)) {
      try {
        const recordingBuffer = Buffer.from(await recording.arrayBuffer())
        const transcription = await getOpenAI().audio.transcriptions.create({
          file: new File([recordingBuffer], 'recording.webm', { type: 'video/webm' }),
          model: 'whisper-1',
        })
        transcript = transcription.text || null
      } catch {
        // Whisper failure is non-blocking
      }
    }

    // Build analysis prompt + content
    const prompt = buildMicroPrompt(skillFocus, instruction, transcript)
    const messageContent = frameUrls.length > 0
      ? [
          { type: 'text' as const, text: prompt },
          ...frameUrls.slice(0, 2).map(url => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'low' as const },
          })),
        ]
      : [{ type: 'text' as const, text: prompt + '\n\n(No video frames available — evaluate based on context.)' }]

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [{ role: 'user', content: messageContent }],
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in GPT response')

    const feedback = JSON.parse(jsonMatch[0]) as MicroFeedback

    await prisma.microSession.update({
      where: { id: microSession.id },
      data: {
        transcript,
        feedback: JSON.parse(JSON.stringify(feedback)),
        status: 'complete',
      },
    })

    // If user opted out of data storage, delete recording blobs
    const authSession2 = await getServerSession(authOptions)
    const authUserId2 = (authSession2?.user as any)?.id as string | undefined
    if (authUserId2) {
      const keep = await shouldStoreRecording(authUserId2)
      if (!keep) {
        del(blob.url).catch(() => {})
        for (const url of frameUrls) del(url).catch(() => {})
        prisma.microSession.update({
          where: { id: microSession.id },
          data: { recordingUrl: null },
        }).catch(() => {})
      }
    }

    return NextResponse.json({ microSessionId: microSession.id, ...feedback })
  } catch (error) {
    console.error('Micro-session error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
