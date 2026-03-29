import type { EngineConfig } from './types'

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  morningCycleHour: 8,
  eveningCycleHour: 20,
  maxNotificationsPerDay: 5,
  minEngagementForNudge: 80,
  streakWarningHours: 4,
  comebackThresholdDays: 3,
  weeklyReportDay: 1, // Monday
  batchSize: 50,
  maxRetries: 3,
  retryDelayMinutes: 15,
  gptModel: 'gpt-4o-mini',
}

/**
 * Skill categories used in Seeneyu.
 * Must match Clip.skillCategory values in the database.
 */
export const SKILL_CATEGORIES = [
  'eye_contact',
  'facial_expressions',
  'gestures',
  'posture',
  'vocal_tone',
  'vocal_pacing',
  'spatial_awareness',
  'mirroring',
] as const

export type SkillCategory = (typeof SKILL_CATEGORIES)[number]

/**
 * Timezone brackets for batch processing.
 * Each bracket covers a 1-hour window.
 */
export function getTimezonesBracket(targetHour: number): string[] {
  // Common timezones grouped by UTC offset
  const ALL_TIMEZONES: Record<string, number> = {
    'Pacific/Honolulu': -10,
    'America/Anchorage': -9,
    'America/Los_Angeles': -8,
    'America/Denver': -7,
    'America/Chicago': -6,
    'America/New_York': -5,
    'America/Sao_Paulo': -3,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Europe/Helsinki': 2,
    'Asia/Dubai': 4,
    'Asia/Kolkata': 5.5,
    'Asia/Bangkok': 7,
    'Asia/Ho_Chi_Minh': 7,
    'Asia/Shanghai': 8,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 11,
    'Pacific/Auckland': 13,
    UTC: 0,
  }

  const nowUtcHour = new Date().getUTCHours()
  const result: string[] = []

  for (const [tz, offset] of Object.entries(ALL_TIMEZONES)) {
    const localHour = (nowUtcHour + offset + 24) % 24
    if (Math.floor(localHour) === targetHour) {
      result.push(tz)
    }
  }

  return result
}
