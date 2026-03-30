import { prisma } from '@/lib/prisma'
import { getHeartsConfig } from '@/lib/access-control'

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

  const config = getHeartsConfig(user?.plan || 'basic')

  // Standard and Advanced plans have unlimited hearts
  if (user?.plan === 'standard' || user?.plan === 'advanced') {
    return { hearts: 999, refillAt: null }
  }

  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId, hearts: config.maxHearts },
    update: {},
  })

  // Check if auto-refill is due
  if (
    gamification.hearts < config.maxHearts &&
    gamification.heartsRefillAt &&
    new Date() >= gamification.heartsRefillAt
  ) {
    await prisma.userGamification.update({
      where: { userId },
      data: { hearts: config.maxHearts, heartsRefillAt: null },
    })
    return { hearts: config.maxHearts, refillAt: null }
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

  const config = getHeartsConfig(user?.plan || 'basic')

  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId, hearts: config.maxHearts },
    update: {},
  })

  if (gamification.hearts <= 0) {
    return { hearts: 0, outOfHearts: true }
  }

  const newHearts = gamification.hearts - 1
  const refillAt =
    gamification.heartsRefillAt ??
    new Date(Date.now() + config.refillHours * 60 * 60 * 1000)

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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  const config = getHeartsConfig(user?.plan || 'basic')

  await prisma.userGamification.upsert({
    where: { userId },
    create: { userId, hearts: config.maxHearts },
    update: { hearts: config.maxHearts, heartsRefillAt: null },
  })
}
