import { prisma } from '@/lib/prisma'
import type {
  LearnerContext,
  ILearner,
  EngineConfig,
  TriggerType,
} from './types'
import { DEFAULT_ENGINE_CONFIG, getTimezonesBracket } from './config'
import { getRegistry } from './registry'
import { InAppChannel } from '../channels/in-app-channel'
import { analyzeProgress } from '../analyzers/progress-analyzer'
import { analyzeEngagement } from '../analyzers/engagement-analyzer'
import { analyzeSkillGaps } from '../analyzers/skill-gap-analyzer'
import { generateDailyPlan } from '../planners/activity-planner'
import { scheduleReminders } from '../planners/reminder-planner'
import { selectMotivation } from '../planners/motivation-planner'
import { processQueue, scheduleNotification } from '../scheduler/scheduler'

/**
 * LearningAssistantEngine orchestrates analysis, planning, and notification
 * for adaptive learning support.
 */
export class LearningAssistantEngine {
  private config: EngineConfig

  constructor(config?: Partial<EngineConfig>) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config }
    this.registerDefaultChannels()
  }

  private registerDefaultChannels() {
    const registry = getRegistry()
    if (!registry.getChannel('in_app')) {
      registry.registerChannel(new InAppChannel())
    }
  }

  /**
   * Morning cycle: analyze + plan + schedule for users in the current timezone bracket.
   */
  async runMorningCycle(): Promise<{ usersProcessed: number; plansCreated: number; remindersScheduled: number }> {
    const timezones = getTimezonesBracket(this.config.morningCycleHour)
    if (timezones.length === 0) timezones.push('UTC')

    // Find users in these timezones (or all if UTC)
    const profiles = await prisma.learnerProfile.findMany({
      where: { timezone: { in: timezones } },
      select: { userId: true },
    })

    // Also process users without a profile (default UTC)
    let userIds = profiles.map(p => p.userId)
    if (timezones.includes('UTC')) {
      const usersWithoutProfile = await prisma.user.findMany({
        where: {
          status: 'approved',
          learnerProfile: null,
        },
        select: { id: true },
        take: 100,
      })
      userIds = [...userIds, ...usersWithoutProfile.map(u => u.id)]
    }

    let plansCreated = 0
    let remindersScheduled = 0

    for (const userId of userIds) {
      try {
        const ctx = await this.buildLearnerContext(userId)

        // Generate and store daily plan
        const activities = await generateDailyPlan(userId, ctx)
        const today = new Date().toISOString().slice(0, 10)

        await prisma.learningPlan.upsert({
          where: { userId_type_date: { userId, type: 'daily', date: today } },
          create: {
            userId,
            type: 'daily',
            date: today,
            activities: activities as object[],
            totalCount: activities.length,
          },
          update: {
            activities: activities as object[],
            totalCount: activities.length,
          },
        })
        plansCreated++

        // Schedule reminders
        const count = await scheduleReminders(userId, ctx)
        remindersScheduled += count

        // Update learner profile with latest analysis
        await this.updateLearnerProfile(userId, ctx)
      } catch {
        // Continue with next user
      }
    }

    return { usersProcessed: userIds.length, plansCreated, remindersScheduled }
  }

  /**
   * Evening cycle: send streak warnings for users who haven't practiced.
   */
  async runEveningCycle(): Promise<{ warnings: number }> {
    const timezones = getTimezonesBracket(this.config.eveningCycleHour)
    if (timezones.length === 0) timezones.push('UTC')

    const profiles = await prisma.learnerProfile.findMany({
      where: { timezone: { in: timezones } },
      select: { userId: true },
    })

    let warnings = 0
    const today = new Date().toISOString().slice(0, 10)

    for (const { userId } of profiles) {
      try {
        const gamification = await prisma.userGamification.findUnique({
          where: { userId },
          select: { lastActivityDate: true, currentStreak: true },
        })

        if (!gamification) continue

        // If user has a streak but hasn't practiced today
        if (
          gamification.currentStreak > 0 &&
          gamification.lastActivityDate !== today
        ) {
          await scheduleNotification(
            userId,
            'streak_warning',
            'in_app',
            new Date(), // Send immediately
            {
              priority: 'high',
              context: { currentStreak: gamification.currentStreak },
            }
          )
          warnings++
        }
      } catch {
        // Continue
      }
    }

    return { warnings }
  }

  /**
   * Weekly report: generate and schedule weekly summary notifications.
   */
  async runWeeklyReport(): Promise<{ reports: number }> {
    // Get all active users with profiles
    const profiles = await prisma.learnerProfile.findMany({
      where: { engagementScore: { gt: 0 } },
      select: { userId: true },
      take: 500,
    })

    let reports = 0

    for (const { userId } of profiles) {
      try {
        const progress = await analyzeProgress(userId)
        const engagement = await analyzeEngagement(userId)

        await scheduleNotification(
          userId,
          'weekly_report',
          'in_app',
          new Date(),
          {
            priority: 'normal',
            context: {
              lessonsThisWeek: progress.lessonsThisWeek,
              xpVelocity: progress.xpVelocity,
              avgQuizScore: progress.avgQuizScore,
              arcadeCount: progress.arcadeScores.count,
              engagementTrend: engagement.isDropping ? 'dropping' : 'stable',
            },
          }
        )
        reports++
      } catch {
        // Continue
      }
    }

    return { reports }
  }

  /**
   * Hook called after processActivity() in gamification.
   * Triggers real-time notifications for achievements.
   */
  async onActivity(
    userId: string,
    result: {
      xpGained: number
      leveledUp: boolean
      newLevel: number
      badgesEarned: { slug: string; name: string }[]
      currentStreak: number
    }
  ): Promise<void> {
    // Level up notification
    if (result.leveledUp) {
      await scheduleNotification(userId, 'level_up', 'in_app', new Date(), {
        priority: 'high',
        title: `Level ${result.newLevel} reached!`,
        body: `Amazing progress! You've reached level ${result.newLevel}. Keep pushing your communication skills forward!`,
        deepLink: '/dashboard',
      })
    }

    // Badge earned notification
    for (const badge of result.badgesEarned) {
      await scheduleNotification(userId, 'badge_earned', 'in_app', new Date(), {
        priority: 'high',
        title: `Badge earned: ${badge.name}`,
        body: `Congratulations! You've earned the "${badge.name}" badge. Check your profile to see all your achievements.`,
        deepLink: '/dashboard',
      })
    }

    // Celebration for milestone streaks
    if (result.currentStreak > 0 && result.currentStreak % 7 === 0) {
      await scheduleNotification(userId, 'celebration', 'in_app', new Date(), {
        priority: 'normal',
        title: `${result.currentStreak}-day streak!`,
        body: `You've been practicing for ${result.currentStreak} days straight. That's incredible dedication!`,
        deepLink: '/dashboard',
      })
    }

    // Update learner profile engagement asynchronously
    try {
      const engagement = await analyzeEngagement(userId)
      await prisma.learnerProfile.upsert({
        where: { userId },
        create: {
          userId,
          engagementScore: engagement.engagementScore,
          optimalPracticeTime: engagement.optimalPracticeTime,
          practiceTimeConfidence: engagement.practiceTimeConfidence,
          lastEngagementCalc: new Date(),
        },
        update: {
          engagementScore: engagement.engagementScore,
          optimalPracticeTime: engagement.optimalPracticeTime,
          practiceTimeConfidence: engagement.practiceTimeConfidence,
          lastEngagementCalc: new Date(),
        },
      })
    } catch {
      // Non-critical, don't throw
    }
  }

  /**
   * Returns a proactive suggestion string for Coach Ney to use in conversation.
   */
  async getProactiveSuggestion(userId: string): Promise<string> {
    try {
      const ctx = await this.buildLearnerContext(userId)

      // Priority: comeback > streak warning > skill gap > morning motivation
      if (ctx.engagement.daysSinceLastActivity >= this.config.comebackThresholdDays) {
        const msg = await selectMotivation(userId, 'comeback', {
          daysAway: ctx.engagement.daysSinceLastActivity,
        })
        return `${msg.title} ${msg.body}`
      }

      if (ctx.engagement.daysSinceLastActivity >= 1 && ctx.engagement.engagementScore < 50) {
        const msg = await selectMotivation(userId, 'streak_warning')
        return `${msg.title} ${msg.body}`
      }

      if (ctx.skillGaps.weakSkills.length > 0) {
        const skill = ctx.skillGaps.weakSkills[0].replace(/_/g, ' ')
        const msg = await selectMotivation(userId, 'skill_gap_nudge', { skill })
        return `${msg.title} ${msg.body}`
      }

      const msg = await selectMotivation(userId, 'morning_motivation')
      return `${msg.title} ${msg.body}`
    } catch {
      return 'Ready to practice your body language skills today? Even 5 minutes makes a difference!'
    }
  }

  /**
   * Process the notification queue. Called by cron.
   */
  async processNotificationQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    return processQueue(this.config.batchSize)
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async buildLearnerContext(userId: string): Promise<LearnerContext> {
    const [profile, progress, engagement, skillGaps] = await Promise.all([
      this.getOrCreateLearnerProfile(userId),
      analyzeProgress(userId),
      analyzeEngagement(userId),
      analyzeSkillGaps(userId),
    ])

    const learner: ILearner = {
      userId,
      timezone: profile.timezone,
      preferredChannels: profile.preferredChannels as string[],
      optOutChannels: profile.optOutChannels as string[],
      optimalPracticeTime: profile.optimalPracticeTime,
      practiceTimeConfidence: profile.practiceTimeConfidence,
      avgSessionsPerWeek: profile.avgSessionsPerWeek,
      engagementScore: profile.engagementScore,
      weakSkills: profile.weakSkills as string[],
      strongSkills: profile.strongSkills as string[],
      notificationFrequency: profile.notificationFrequency as 'quiet' | 'normal' | 'active',
    }

    return { learner, progress, engagement, skillGaps }
  }

  private async getOrCreateLearnerProfile(userId: string) {
    let profile = await prisma.learnerProfile.findUnique({ where: { userId } })
    if (!profile) {
      profile = await prisma.learnerProfile.create({
        data: { userId },
      })
    }
    return profile
  }

  private async updateLearnerProfile(userId: string, ctx: LearnerContext) {
    await prisma.learnerProfile.upsert({
      where: { userId },
      create: {
        userId,
        engagementScore: ctx.engagement.engagementScore,
        optimalPracticeTime: ctx.engagement.optimalPracticeTime,
        practiceTimeConfidence: ctx.engagement.practiceTimeConfidence,
        weakSkills: ctx.skillGaps.weakSkills,
        strongSkills: ctx.skillGaps.strongSkills,
        skillGapUpdatedAt: new Date(),
        lastEngagementCalc: new Date(),
      },
      update: {
        engagementScore: ctx.engagement.engagementScore,
        optimalPracticeTime: ctx.engagement.optimalPracticeTime,
        practiceTimeConfidence: ctx.engagement.practiceTimeConfidence,
        weakSkills: ctx.skillGaps.weakSkills,
        strongSkills: ctx.skillGaps.strongSkills,
        skillGapUpdatedAt: new Date(),
        lastEngagementCalc: new Date(),
      },
    })
  }
}
