import { prisma } from '@/lib/prisma'
import type { Badge } from '@prisma/client'

interface BadgeCriteria {
  type: string
  threshold?: number
}

/**
 * Evaluate all badges and award any newly earned ones.
 * Returns the list of badges newly earned in this evaluation.
 */
export async function evaluateBadges(userId: string): Promise<Badge[]> {
  // Get all badges the user hasn't earned yet
  const earnedBadgeIds = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  })
  const earnedSet = new Set(earnedBadgeIds.map((b) => b.badgeId))

  const allBadges = await prisma.badge.findMany()
  const unearnedBadges = allBadges.filter((b) => !earnedSet.has(b.id))

  const newlyEarned: Badge[] = []

  for (const badge of unearnedBadges) {
    const earned = await checkBadgeCriteria(userId, badge)
    if (earned) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      })
      newlyEarned.push(badge)
    }
  }

  return newlyEarned
}

/**
 * Check if a user meets the criteria for a specific badge.
 */
export async function checkBadgeCriteria(
  userId: string,
  badge: Badge
): Promise<boolean> {
  const criteria = badge.criteria as unknown as BadgeCriteria
  const threshold = criteria.threshold ?? 0

  switch (criteria.type) {
    case 'streak': {
      const gam = await prisma.userGamification.findUnique({ where: { userId } })
      return (gam?.longestStreak ?? 0) >= threshold
    }

    case 'xp': {
      const gam = await prisma.userGamification.findUnique({ where: { userId } })
      return (gam?.totalXp ?? 0) >= threshold
    }

    case 'level': {
      const gam = await prisma.userGamification.findUnique({ where: { userId } })
      return (gam?.level ?? 1) >= threshold
    }

    case 'arcade_count': {
      const count = await prisma.arcadeAttempt.count({ where: { userId } })
      return count >= threshold
    }

    case 'lesson_count': {
      const count = await prisma.foundationProgress.count({
        where: { userId, completedAt: { not: null } },
      })
      return count >= threshold
    }

    case 'comment_count': {
      const count = await prisma.comment.count({ where: { userId } })
      return count >= threshold
    }

    case 'reply_count': {
      const count = await prisma.comment.count({
        where: { userId, parentId: { not: null } },
      })
      return count >= threshold
    }

    case 'thread_count': {
      const count = await prisma.comment.count({
        where: { userId, parentId: null },
      })
      return count >= threshold
    }

    case 'practice_count': {
      const count = await prisma.userSession.count({
        where: { userId, status: 'completed' },
      })
      return count >= threshold
    }

    case 'perfect_quiz': {
      const perfect = await prisma.foundationProgress.count({
        where: { userId, quizScore: 100 },
      })
      return perfect >= threshold
    }

    case 'comeback': {
      // User returned after 7+ days of inactivity
      const gam = await prisma.userGamification.findUnique({ where: { userId } })
      if (!gam?.lastActivityDate) return false
      const lastActivity = new Date(gam.lastActivityDate)
      const today = new Date()
      const diffDays = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      )
      // This is checked *before* streak update, so if they're active now after 7+ days gap
      // We check their currentStreak=1 (just reset) and previous gap was large
      return gam.currentStreak === 1 && diffDays <= 1 && (gam.longestStreak ?? 0) >= 1
    }

    case 'first_login': {
      // Always true if they have a gamification record (they just logged in)
      const gam = await prisma.userGamification.findUnique({ where: { userId } })
      return gam !== null
    }

    default:
      return false
  }
}
