import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, quizScore, quizPassed } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

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

  return NextResponse.json({ progress })
}
