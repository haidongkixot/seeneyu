import { prisma } from '@/lib/prisma'

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

/**
 * Check and update the user's activity streak.
 * Call this on any scored activity (quiz, arcade, practice, etc.).
 *
 * - If lastActivityDate is today: no change (already counted)
 * - If lastActivityDate is yesterday: streak continues
 * - If lastActivityDate is older: streak breaks (unless freeze is available)
 */
export async function checkAndUpdateStreak(
  userId: string
): Promise<{ currentStreak: number; continued: boolean; broken: boolean }> {
  const today = getTodayDate()
  const yesterday = getYesterdayDate()

  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId, lastActivityDate: today, currentStreak: 1 },
    update: {},
  })

  const { lastActivityDate, currentStreak, longestStreak, streakFreezes } = gamification

  // Already logged activity today
  if (lastActivityDate === today) {
    return { currentStreak, continued: true, broken: false }
  }

  // Streak continues (last activity was yesterday)
  if (lastActivityDate === yesterday) {
    const newStreak = currentStreak + 1
    await prisma.userGamification.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(longestStreak, newStreak),
        lastActivityDate: today,
      },
    })
    return { currentStreak: newStreak, continued: true, broken: false }
  }

  // Streak would break — try auto-freeze if available
  if (lastActivityDate && lastActivityDate < yesterday && streakFreezes > 0) {
    // Use a freeze to preserve the streak, then continue
    const newStreak = currentStreak + 1
    await prisma.userGamification.update({
      where: { userId },
      data: {
        streakFreezes: { decrement: 1 },
        currentStreak: newStreak,
        longestStreak: Math.max(longestStreak, newStreak),
        lastActivityDate: today,
      },
    })
    return { currentStreak: newStreak, continued: true, broken: false }
  }

  // Streak breaks — reset to 1
  await prisma.userGamification.update({
    where: { userId },
    data: {
      currentStreak: 1,
      lastActivityDate: today,
    },
  })
  return { currentStreak: 1, continued: false, broken: currentStreak > 1 }
}

/**
 * Manually use a streak freeze (e.g., from a UI button on a missed day).
 * Returns true if freeze was used, false if none available.
 */
export async function useStreakFreeze(userId: string): Promise<boolean> {
  const gamification = await prisma.userGamification.findUnique({
    where: { userId },
  })
  if (!gamification || gamification.streakFreezes <= 0) return false

  await prisma.userGamification.update({
    where: { userId },
    data: { streakFreezes: { decrement: 1 } },
  })
  return true
}
