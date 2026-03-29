import { prisma } from '@/lib/prisma'
import type { TriggerType } from '../core/types'

/**
 * Mustache-style template renderer.
 * Replaces {{variable}} placeholders with values.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key]
    if (value === undefined || value === null) return match
    return String(value)
  })
}

/**
 * Resolves all standard variables for a user and trigger type.
 * Returns a flat key-value map ready for template interpolation.
 */
export async function resolveVariables(
  userId: string,
  triggerType: TriggerType
): Promise<Record<string, string | number>> {
  const [user, gamification] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.userGamification.findUnique({
      where: { userId },
      select: {
        totalXp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
      },
    }),
  ])

  const vars: Record<string, string | number> = {
    name: user?.name || 'Learner',
    firstName: (user?.name || 'Learner').split(' ')[0],
    level: gamification?.level ?? 1,
    xp: gamification?.totalXp ?? 0,
    streak: gamification?.currentStreak ?? 0,
    longestStreak: gamification?.longestStreak ?? 0,
    triggerType,
  }

  // Add trigger-specific variables
  if (triggerType === 'weekly_report') {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [lessonsCount, xpEarned] = await Promise.all([
      prisma.foundationProgress.count({
        where: { userId, completedAt: { gte: sevenDaysAgo } },
      }),
      prisma.xpTransaction.aggregate({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
        _sum: { amount: true },
      }),
    ])

    vars.lessonsThisWeek = lessonsCount
    vars.xpThisWeek = xpEarned._sum.amount ?? 0
  }

  return vars
}
