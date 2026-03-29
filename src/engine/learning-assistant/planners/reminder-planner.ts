import type { LearnerContext, TriggerType } from '../core/types'
import { DEFAULT_ENGINE_CONFIG } from '../core/config'
import { scheduleNotification } from '../scheduler/scheduler'

/**
 * Creates ScheduledNotification records based on learner context.
 * Handles: morning motivation, streak warnings, comeback messages, skill nudges.
 */
export async function scheduleReminders(
  userId: string,
  ctx: LearnerContext
): Promise<number> {
  let scheduled = 0
  const config = DEFAULT_ENGINE_CONFIG

  // Determine user's local time context
  const practiceHour = ctx.engagement.optimalPracticeTime
    ? parseInt(ctx.engagement.optimalPracticeTime.split(':')[0])
    : config.morningCycleHour

  // 1. Morning motivation — schedule for optimal practice time
  if (ctx.engagement.engagementScore < config.minEngagementForNudge) {
    const morningTime = getScheduledTime(ctx.learner.timezone, practiceHour)
    if (morningTime > new Date()) {
      await scheduleNotification(
        userId,
        'morning_motivation',
        'in_app',
        morningTime,
        {
          priority: 'normal',
          context: {
            streak: ctx.engagement.daysSinceLastActivity === 0 ? 'active' : 'at_risk',
            lessonsThisWeek: ctx.progress.lessonsThisWeek,
          },
        }
      )
      scheduled++
    }
  }

  // 2. Streak warning — if user hasn't practiced today
  if (ctx.engagement.daysSinceLastActivity >= 1 && ctx.engagement.engagementScore > 20) {
    const warningTime = getScheduledTime(
      ctx.learner.timezone,
      config.eveningCycleHour
    )
    if (warningTime > new Date()) {
      await scheduleNotification(
        userId,
        'streak_warning',
        'in_app',
        warningTime,
        {
          priority: 'high',
          context: {
            daysMissed: ctx.engagement.daysSinceLastActivity,
          },
        }
      )
      scheduled++
    }
  }

  // 3. Comeback message — for users inactive 3+ days
  if (ctx.engagement.daysSinceLastActivity >= config.comebackThresholdDays) {
    const comebackTime = getScheduledTime(ctx.learner.timezone, practiceHour)
    if (comebackTime > new Date()) {
      await scheduleNotification(
        userId,
        'comeback',
        'in_app',
        comebackTime,
        {
          priority: 'high',
          context: {
            daysAway: ctx.engagement.daysSinceLastActivity,
            weakSkill: ctx.skillGaps.weakSkills[0] || null,
          },
        }
      )
      scheduled++
    }
  }

  // 4. Skill gap nudge — for users with neglected skills
  if (ctx.skillGaps.neglectedSkills.length > 0 && ctx.engagement.engagementScore > 30) {
    const nudgeTime = getScheduledTime(ctx.learner.timezone, practiceHour + 2)
    if (nudgeTime > new Date()) {
      await scheduleNotification(
        userId,
        'skill_gap_nudge',
        'in_app',
        nudgeTime,
        {
          priority: 'low',
          context: {
            skill: ctx.skillGaps.neglectedSkills[0],
            daysSince: ctx.skillGaps.daysSinceBySkill[ctx.skillGaps.neglectedSkills[0]] || 0,
          },
        }
      )
      scheduled++
    }
  }

  return scheduled
}

/**
 * Get a Date object for today at a specific hour in the user's timezone.
 */
function getScheduledTime(timezone: string, hour: number): Date {
  const now = new Date()
  // Simple approach: create a date string in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  try {
    const parts = formatter.formatToParts(now)
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    // Create a date in UTC that corresponds to the target local time
    const dateStr = `${year}-${month}-${day}T${hour.toString().padStart(2, '0')}:00:00`
    // This is approximate — good enough for notification scheduling
    return new Date(dateStr + 'Z')
  } catch {
    // Fallback: schedule for the given hour UTC today
    const d = new Date()
    d.setUTCHours(hour, 0, 0, 0)
    return d
  }
}
