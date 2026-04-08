import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXp, XP_AMOUNTS } from '@/services/gamification/xp-engine'
import { updateQuestProgress } from '@/services/gamification/quest-generator'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, quizScore, quizPassed } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

  // Check if lesson was already completed (to avoid double-awarding XP)
  const existing = await prisma.foundationProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { completedAt: true },
  })
  const wasAlreadyCompleted = !!existing?.completedAt

  const progress = await prisma.foundationProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {
      quizScore: quizScore ?? undefined,
      quizPassed: quizPassed ?? false,
      completedAt: quizPassed ? new Date() : undefined,
    },
    create: {
      userId,
      lessonId,
      quizScore: quizScore ?? null,
      quizPassed: quizPassed ?? false,
      completedAt: quizPassed ? new Date() : null,
    },
  })

  // Award XP only on first-time completion to prevent farming
  let xpResult: any = null
  if (quizPassed && !wasAlreadyCompleted) {
    const lessonXp = quizScore === 100 ? XP_AMOUNTS.foundation_quiz_perfect : XP_AMOUNTS.foundation_lesson
    try {
      xpResult = await awardXp(userId, lessonXp, 'foundation_lesson', lessonId, { quizScore })
    } catch (e: any) {
      console.warn('[foundation] awardXp failed:', e?.message)
    }
    updateQuestProgress(userId, 'finish_lesson', 1).catch(() => {})
  }

  return NextResponse.json({
    progress,
    xpEarned: xpResult?.totalXp ? (quizScore === 100 ? XP_AMOUNTS.foundation_quiz_perfect : XP_AMOUNTS.foundation_lesson) : 0,
    leveledUp: xpResult?.leveledUp ?? false,
    newLevel: xpResult?.level,
  })
}
