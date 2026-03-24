import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  const bundle = await (prisma as any).arcadeBundle.findUnique({
    where: { id },
    include: {
      challenges: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  if (!bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
  }

  // Get user's best scores per challenge
  let bestScores: Record<string, { score: number; breakdown: any; feedbackLine: string | null }> = {}
  if (userId) {
    const attempts = await (prisma as any).arcadeAttempt.findMany({
      where: {
        userId,
        challengeId: { in: bundle.challenges.map((c: any) => c.id) },
      },
      orderBy: { score: 'desc' },
    })

    for (const a of attempts) {
      if (!bestScores[a.challengeId] || a.score > bestScores[a.challengeId].score) {
        bestScores[a.challengeId] = {
          score: a.score,
          breakdown: a.breakdown,
          feedbackLine: a.feedbackLine,
        }
      }
    }
  }

  // Determine unlock status: challenge N+1 is unlocked if challenge N is completed
  const completedSet = new Set(Object.keys(bestScores))

  const challenges = bundle.challenges.map((c: any, i: number) => {
    const isComplete = completedSet.has(c.id)
    const isLocked = i > 0 && !completedSet.has(bundle.challenges[i - 1].id)

    return {
      ...c,
      isComplete,
      isLocked,
      bestScore: bestScores[c.id]?.score ?? null,
      bestBreakdown: bestScores[c.id]?.breakdown ?? null,
      bestFeedback: bestScores[c.id]?.feedbackLine ?? null,
    }
  })

  return NextResponse.json({
    ...bundle,
    challenges,
    completedCount: completedSet.size,
  })
}
