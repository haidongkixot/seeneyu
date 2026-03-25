import { prisma } from '@/lib/prisma'

const MAX_HEARTS = 5
const REFILL_HOURS = 4

/**
 * Get the user's current heart count and refill time.
 * Standard/Advanced plans get unlimited hearts (999).
 */
export async function getHearts(
  userId: string
): Promise<{ hearts: number; refillAt: Date | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  // Standard and Advanced plans have unlimited hearts
  if (user?.plan === 'standard' || user?.plan === 'advanced') {
    return { hearts: 999, refillAt: null }
  }

  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  // Check if auto-refill is due
  if (
    gamification.hearts < MAX_HEARTS &&
    gamification.heartsRefillAt &&
    new Date() >= gamification.heartsRefillAt
  ) {
    await prisma.userGamification.update({
      where: { userId },
      data: { hearts: MAX_HEARTS, heartsRefillAt: null },
    })
    return { hearts: MAX_HEARTS, refillAt: null }
  }

  return {
    hearts: gamification.hearts,
    refillAt: gamification.heartsRefillAt,
  }
}

/**
 * Deduct a heart on quiz fail or arcade score < 40.
 * Returns updated heart count and whether the user is out of hearts.
 */
export async function deductHeart(
  userId: string
): Promise<{ hearts: number; outOfHearts: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  // Unlimited plans never lose hearts
  if (user?.plan === 'standard' || user?.plan === 'advanced') {
    return { hearts: 999, outOfHearts: false }
  }

  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  if (gamification.hearts <= 0) {
    return { hearts: 0, outOfHearts: true }
  }

  const newHearts = gamification.hearts - 1
  const refillAt =
    gamification.heartsRefillAt ??
    new Date(Date.now() + REFILL_HOURS * 60 * 60 * 1000)

  await prisma.userGamification.update({
    where: { userId },
    data: {
      hearts: newHearts,
      heartsRefillAt: refillAt,
    },
  })

  return { hearts: newHearts, outOfHearts: newHearts <= 0 }
}

/**
 * Refill hearts to max (e.g., after waiting or via purchase).
 */
export async function refillHearts(userId: string): Promise<void> {
  await prisma.userGamification.upsert({
    where: { userId },
    create: { userId, hearts: MAX_HEARTS },
    update: { hearts: MAX_HEARTS, heartsRefillAt: null },
  })
}
