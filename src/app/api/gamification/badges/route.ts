import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = authUser.id

  const allBadges = await prisma.badge.findMany({
    orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
  })

  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true, earnedAt: true },
  })

  const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]))

  const badges = allBadges.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) ?? null,
  }))

  return NextResponse.json({ badges })
}
