import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

/**
 * POST /api/notifications/mark-read
 * Mark notifications as read.
 * Body: { ids: string[] } or { all: true }
 */
export async function POST(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const now = new Date()

  if (body.all) {
    // Mark all unread notifications as read
    const result = await prisma.notificationLog.updateMany({
      where: {
        userId: authUser.id,
        openedAt: null,
      },
      data: { openedAt: now },
    })
    return NextResponse.json({ updated: result.count })
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const result = await prisma.notificationLog.updateMany({
      where: {
        id: { in: body.ids },
        userId: authUser.id,
        openedAt: null,
      },
      data: { openedAt: now },
    })
    return NextResponse.json({ updated: result.count })
  }

  return NextResponse.json({ error: 'Provide ids array or all: true' }, { status: 400 })
}
