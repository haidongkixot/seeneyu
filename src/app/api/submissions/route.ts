import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const [submissions, total] = await Promise.all([
    prisma.userSession.findMany({
      where: { userId: user.id, status: { in: ['complete', 'failed'] } },
      include: { clip: { select: { skillCategory: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.userSession.count({
      where: { userId: user.id, status: { in: ['complete', 'failed'] } },
    }),
  ])

  const items = submissions.map((s) => {
    const scores = s.scores as Record<string, number> | null
    const overallScore = scores?.overall ?? (s.feedback as Record<string, unknown> | null)?.overallScore ?? null
    return {
      id: s.id,
      clipId: s.clipId,
      skillCategory: s.clip.skillCategory,
      recordingUrl: s.recordingUrl,
      thumbnailUrl: s.thumbnailUrl,
      score: typeof overallScore === 'number' ? overallScore : null,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }
  })

  return NextResponse.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
  })
}
