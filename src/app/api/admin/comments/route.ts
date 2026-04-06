import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * GET /api/admin/comments?filter=all|hidden&lessonId=X&challengeId=X&page=1
 * Admin: list comments with filters.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') ?? 'all'
    const lessonId = searchParams.get('lessonId')
    const challengeId = searchParams.get('challengeId')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = 30

    const where: any = {}
    if (filter === 'hidden') where.isHidden = true
    if (lessonId) where.lessonId = lessonId
    if (challengeId) where.challengeId = challengeId

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        select: {
          id: true,
          body: true,
          isHidden: true,
          hiddenBy: true,
          hiddenAt: true,
          createdAt: true,
          parentId: true,
          user: { select: { id: true, name: true, email: true } },
          lesson: { select: { id: true, title: true } },
          challenge: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ])

    return NextResponse.json({ comments, total, page, limit })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
