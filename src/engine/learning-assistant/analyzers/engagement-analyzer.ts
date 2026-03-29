import { prisma } from '@/lib/prisma'
import type { EngagementSnapshot } from '../core/types'

/**
 * Analyzes user engagement patterns to determine optimal practice times,
 * detect dropping engagement, and compute a rolling engagement score.
 */
export async function analyzeEngagement(userId: string): Promise<EngagementSnapshot> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch activity events for pattern analysis
  const [activities, gamification] = await Promise.all([
    prisma.activityEvent.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userGamification.findUnique({
      where: { userId },
      select: { lastActivityDate: true, currentStreak: true },
    }),
  ])

  // Days since last activity
  let daysSinceLastActivity = 999
  if (activities.length > 0) {
    const lastActivity = activities[0].createdAt
    daysSinceLastActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    )
  } else if (gamification?.lastActivityDate) {
    const last = new Date(gamification.lastActivityDate)
    daysSinceLastActivity = Math.floor(
      (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  // Find optimal practice time by grouping by hour
  const hourCounts: Record<number, number> = {}
  for (const a of activities) {
    const hour = a.createdAt.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  }

  let optimalPracticeTime: string | null = null
  let practiceTimeConfidence = 0

  if (activities.length >= 5) {
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
    if (sortedHours.length > 0) {
      const peakHour = parseInt(sortedHours[0][0])
      const peakCount = sortedHours[0][1]
      optimalPracticeTime = `${peakHour.toString().padStart(2, '0')}:00`
      practiceTimeConfidence = Math.min(peakCount / activities.length * 2, 1)
    }
  }

  // Compute engagement score (0-100)
  // Factors: recency, frequency, streak, consistency
  const recencyScore = daysSinceLastActivity === 0 ? 30
    : daysSinceLastActivity <= 1 ? 25
    : daysSinceLastActivity <= 3 ? 15
    : daysSinceLastActivity <= 7 ? 5
    : 0

  // Frequency: activities per week over last 30 days
  const activitiesPerWeek = activities.length / 4.3
  const frequencyScore = Math.min(activitiesPerWeek * 5, 30)

  // Streak bonus
  const streak = gamification?.currentStreak ?? 0
  const streakScore = Math.min(streak * 2, 20)

  // Consistency: how many distinct days had activity in last 14 days
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const recentActivities = activities.filter(a => a.createdAt >= fourteenDaysAgo)
  const uniqueDays = new Set(
    recentActivities.map(a => a.createdAt.toISOString().slice(0, 10))
  )
  const consistencyScore = Math.min((uniqueDays.size / 14) * 20, 20)

  const engagementScore = Math.round(
    recencyScore + frequencyScore + streakScore + consistencyScore
  )

  // Detect dropping engagement
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const lastWeekCount = activities.filter(a => a.createdAt >= sevenDaysAgo).length
  const prevWeekCount = activities.filter(
    a => a.createdAt < sevenDaysAgo && a.createdAt >= fourteenDaysAgo
  ).length
  const isDropping = prevWeekCount > 0 && lastWeekCount < prevWeekCount * 0.5

  return {
    engagementScore: Math.min(engagementScore, 100),
    optimalPracticeTime,
    practiceTimeConfidence: Math.round(practiceTimeConfidence * 100) / 100,
    daysSinceLastActivity,
    isDropping,
  }
}
