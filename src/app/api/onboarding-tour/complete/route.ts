import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string

  const body = await req.json().catch(() => ({}))
  const skipped = body.skipped === true

  // Mark tour completed
  await prisma.user.update({
    where: { id: userId },
    data: { tourCompleted: true },
  })

  // Award XP if not skipped
  let xpAwarded = 0
  if (!skipped) {
    try {
      const { processActivity } = await import('@/services/gamification')
      const result = await processActivity(userId, 'tour_complete')
      xpAwarded = (result as any)?.xpAwarded ?? (result as any)?.xp ?? 150
    } catch {
      xpAwarded = 0
    }
  }

  return NextResponse.json({ tourCompleted: true, xpAwarded, skipped })
}
