import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

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
