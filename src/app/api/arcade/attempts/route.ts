import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreArcadeAttemptFromAnalysis } from '@/services/expression-scorer'
import { getArcadeChallengesPerType } from '@/lib/access-control'
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
    include: { bundle: { select: { challenges: { select: { id: true, type: true }, orderBy: { orderIndex: 'asc' } } } } },
  })

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // Enforce per-type challenge limit server-side
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const userPlan = dbUser?.plan || 'basic'
  const perTypeLimit = getArcadeChallengesPerType(userPlan)

  if (perTypeLimit < 999) {
    const bundleChallenges: { id: string; type: string }[] = challenge.bundle?.challenges ?? []
    const challengeIndex = bundleChallenges.findIndex((c: { id: string }) => c.id === challengeId)
    if (challengeIndex >= 0) {
      const sameTypeBefore = bundleChallenges
        .slice(0, challengeIndex)
        .filter((c: { type: string }) => c.type === challenge.type).length
      if (sameTypeBefore >= perTypeLimit) {
        return NextResponse.json(
          { error: 'Upgrade your plan to access more challenges of this type', upgradeRequired: true },
          { status: 403 }
        )
      }
    }
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
