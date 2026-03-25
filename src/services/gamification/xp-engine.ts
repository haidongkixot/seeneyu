import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const XP_AMOUNTS: Record<string, number> = {
  foundation_lesson: 25,
  foundation_quiz_perfect: 50,
  arcade_challenge: 20,
  arcade_bundle_complete: 75,
  practice_session: 15,
  full_performance: 100,
  mini_game: 10,
  daily_quest: 50,
  daily_quest_all_bonus: 100,
}

/**
 * Level N requires sum of (N-1)*200 XP total.
 * Level 1: 0 XP, Level 2: 200 XP, Level 3: 600 XP, Level 4: 1200 XP, ...
 * Cumulative: sum from k=1 to N-1 of k*200 = 200 * (N-1)*N/2 = 100*N*(N-1)
 */
export function getLevel(totalXp: number): number {
  // totalXp >= 100 * level * (level - 1)
  // Solve: 100*L*(L-1) <= totalXp => L^2 - L - totalXp/100 <= 0
  // L = (1 + sqrt(1 + 4*totalXp/100)) / 2
  let level = Math.floor((1 + Math.sqrt(1 + 4 * totalXp / 100)) / 2)
  // Clamp to at least 1
  return Math.max(1, level)
}

/**
 * XP needed to reach the next level from the current level.
 * To go from level N to N+1, you need level*200 more XP beyond the threshold for level N.
 */
export function getXpForNextLevel(level: number): number {
  return level * 200
}

/**
 * Total XP required to reach a given level.
 */
export function getTotalXpForLevel(level: number): number {
  return 100 * level * (level - 1)
}

/**
 * Award XP to a user, update their gamification record, and log the transaction.
 */
export async function awardXp(
  userId: string,
  amount: number,
  source: string,
  sourceId?: string,
  metadata?: Prisma.InputJsonValue
): Promise<{ totalXp: number; level: number; leveledUp: boolean }> {
  // Upsert gamification record
  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId, totalXp: amount },
    update: { totalXp: { increment: amount } },
  })

  const newTotalXp = gamification.totalXp
  const newLevel = getLevel(newTotalXp)
  const oldLevel = gamification.level
  const leveledUp = newLevel > oldLevel

  // Update level if changed
  if (leveledUp) {
    await prisma.userGamification.update({
      where: { userId },
      data: { level: newLevel },
    })
  }

  // Log the transaction
  await prisma.xpTransaction.create({
    data: {
      userId,
      amount,
      source,
      sourceId: sourceId ?? undefined,
      metadata: metadata ?? undefined,
    },
  })

  return { totalXp: newTotalXp, level: newLevel, leveledUp }
}
