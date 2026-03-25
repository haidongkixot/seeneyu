import { prisma } from '@/lib/prisma'

/**
 * Returns the ISO week period string for the current date, e.g. "2026-W13".
 */
export function getWeekPeriod(date: Date = new Date()): string {
  // ISO week calculation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Query top 50 users by XP earned this week and save to Leaderboard table.
 */
export async function updateWeeklyLeaderboard(): Promise<void> {
  const period = getWeekPeriod()

  // Get the start of the current ISO week (Monday)
  const now = new Date()
  const day = now.getUTCDay() || 7
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - day + 1)
  monday.setUTCHours(0, 0, 0, 0)

  // Sum XP earned this week per user
  const results = await prisma.xpTransaction.groupBy({
    by: ['userId'],
    _sum: { amount: true },
    where: { createdAt: { gte: monday } },
    orderBy: { _sum: { amount: 'desc' } },
    take: 50,
  })

  // Fetch user info for the top users
  const userIds = results.map((r) => r.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  })

  const gamifications = await prisma.userGamification.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, totalXp: true, level: true },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))
  const gamMap = new Map(gamifications.map((g) => [g.userId, g]))

  const entries = results.map((r, i) => {
    const user = userMap.get(r.userId)
    const gam = gamMap.get(r.userId)
    return {
      rank: i + 1,
      userId: r.userId,
      name: user?.name ?? 'Anonymous',
      image: user?.image ?? null,
      weeklyXp: r._sum.amount ?? 0,
      totalXp: gam?.totalXp ?? 0,
      level: gam?.level ?? 1,
    }
  })

  await prisma.leaderboard.upsert({
    where: { type_period: { type: 'weekly_xp', period } },
    create: { type: 'weekly_xp', period, entries: entries as any },
    update: { entries: entries as any },
  })
}

/**
 * Fetch a cached leaderboard by type and period.
 */
export async function getLeaderboard(
  type: string,
  period: string
): Promise<any[]> {
  const lb = await prisma.leaderboard.findUnique({
    where: { type_period: { type, period } },
  })
  if (!lb) return []
  return lb.entries as any[]
}

/**
 * Find a user's rank in a leaderboard.
 */
export async function getUserRank(
  userId: string,
  type: string,
  period: string
): Promise<number | null> {
  const entries = await getLeaderboard(type, period)
  const entry = entries.find((e: any) => e.userId === userId)
  return entry?.rank ?? null
}
