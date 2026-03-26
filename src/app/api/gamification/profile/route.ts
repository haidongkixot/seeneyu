import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'
import { getLevel, getXpForNextLevel, getTotalXpForLevel } from '@/services/gamification'
import { getHearts } from '@/services/gamification'

export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = authUser.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  // Auto-create gamification record if missing
  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  const level = getLevel(gamification.totalXp)
  const xpForCurrentLevel = getTotalXpForLevel(level)
  const xpForNext = getXpForNextLevel(level)
  const xpProgress = gamification.totalXp - xpForCurrentLevel
  const hearts = await getHearts(userId)

  return NextResponse.json({
    totalXp: gamification.totalXp,
    level,
    xpProgress,
    xpForNextLevel: xpForNext,
    currentStreak: gamification.currentStreak,
    longestStreak: gamification.longestStreak,
    lastActivityDate: gamification.lastActivityDate,
    streakFreezes: gamification.streakFreezes,
    hearts: hearts.hearts,
    heartsRefillAt: hearts.refillAt,
    tier: user?.plan ?? 'basic',
  })
}
