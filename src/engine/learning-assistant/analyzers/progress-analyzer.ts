import { prisma } from '@/lib/prisma'
import type { ProgressSnapshot } from '../core/types'

/**
 * Analyzes a user's learning progress over the last 7 days.
 */
export async function analyzeProgress(userId: string): Promise<ProgressSnapshot> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    lessonsThisWeek,
    quizScores,
    arcadeAttempts,
    quests,
    xpTransactions,
  ] = await Promise.all([
    // Lessons completed this week
    prisma.foundationProgress.count({
      where: {
        userId,
        completedAt: { gte: sevenDaysAgo },
      },
    }),

    // Quiz scores this week
    prisma.foundationProgress.findMany({
      where: {
        userId,
        quizPassed: true,
        completedAt: { gte: sevenDaysAgo },
      },
      select: { quizScore: true },
    }),

    // Arcade attempts this week
    prisma.arcadeAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { score: true },
    }),

    // Daily quests this week
    prisma.dailyQuest.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { completed: true },
    }),

    // XP earned this week
    prisma.xpTransaction.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { amount: true },
    }),
  ])

  // Compute averages
  const scores = quizScores.map(q => q.quizScore ?? 0)
  const avgQuizScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0

  const arcadeScoreValues = arcadeAttempts.map(a => a.score)
  const arcadeAvg = arcadeScoreValues.length > 0
    ? arcadeScoreValues.reduce((a, b) => a + b, 0) / arcadeScoreValues.length
    : 0

  const totalQuests = quests.length
  const completedQuests = quests.filter(q => q.completed).length
  const questCompletionRate = totalQuests > 0
    ? completedQuests / totalQuests
    : 0

  const totalXp = xpTransactions.reduce((sum, t) => sum + t.amount, 0)
  const xpVelocity = totalXp / 7

  return {
    lessonsThisWeek,
    avgQuizScore: Math.round(avgQuizScore * 10) / 10,
    arcadeScores: { avg: Math.round(arcadeAvg * 10) / 10, count: arcadeAttempts.length },
    questCompletionRate: Math.round(questCompletionRate * 100) / 100,
    xpVelocity: Math.round(xpVelocity),
  }
}
