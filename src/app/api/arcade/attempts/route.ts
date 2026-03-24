import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreArcadeAttempt } from '@/services/arcade-scorer'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Sign in to submit attempts' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const body = await req.json()
  const { challengeId, frameUrl } = body

  if (!challengeId || !frameUrl) {
    return NextResponse.json({ error: 'challengeId and frameUrl are required' }, { status: 400 })
  }

  // Fetch challenge info
  const challenge = await (prisma as any).arcadeChallenge.findUnique({
    where: { id: challengeId },
  })

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // Score with GPT-4o Vision
  const result = await scoreArcadeAttempt({
    challengeDescription: challenge.description,
    challengeType: challenge.type as 'facial' | 'gesture',
    context: challenge.context,
    referenceImageUrl: challenge.referenceImageUrl,
    userFrameUrl: frameUrl,
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

  return NextResponse.json({
    id: attempt.id,
    score: result.score,
    breakdown: result.breakdown,
    feedbackLine: result.feedback_line,
    xpEarned: challenge.xpReward,
  })
}
