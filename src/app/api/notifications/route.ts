import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications
 * List user's notification history.
 */
export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
  const offset = (page - 1) * limit

  const [notifications, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.notificationLog.count({
      where: { userId: authUser.id },
    }),
  ])

  return NextResponse.json({
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
