import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreArcadeAttemptFromAnalysis } from '@/services/expression-scorer'
import type { AnalysisSnapshot } from '@/lib/mediapipe-types'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Sign in to submit attempts' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const body = await req.json()
  const { challengeId, snapshots, peakSnapshot } = body as {
    challengeId: string
    snapshots: AnalysisSnapshot[]
    peakSnapshot: AnalysisSnapshot
  }

  if (!challengeId || !snapshots || !peakSnapshot) {
    return NextResponse.json({ error: 'challengeId, snapshots, and peakSnapshot are required' }, { status: 400 })
  }

  // Fetch challenge info
  const challenge = await (prisma as any).arcadeChallenge.findUnique({
    where: { id: challengeId },
  })

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // Score with MediaPipe analysis data (no AI API dependency)
  const result = scoreArcadeAttemptFromAnalysis({
    challengeDescription: challenge.description,
    challengeType: challenge.type as string,
    context: challenge.context,
    snapshots,
    peakSnapshot,
  })

  // Save attempt
  const attempt = await (prisma as any).arcadeAttempt.create({
    data: {
      userId,
      challengeId,
      score: result.score,
      breakdown: result.breakdown,
      feedbackLine: result.feedback_line,
    },
  })

  // Log analysis metric (fire-and-forget)
  ;(prisma as any).analysisMetric.create({
    data: {
      sessionType: 'arcade',
      durationMs: 0,
      faceDetected: !!peakSnapshot?.faceDetected,
      poseDetected: !!peakSnapshot?.poseLandmarks,
      snapshotCount: snapshots.length,
      score: result.score,
    },
  }).catch(() => {})

  return NextResponse.json({
    id: attempt.id,
    score: result.score,
    breakdown: result.breakdown,
    feedbackLine: result.feedback_line,
    xpEarned: challenge.xpReward,
  })
}
