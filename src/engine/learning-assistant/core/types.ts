/**
 * Learning Assistant Engine — Core Type Definitions
 * Domain-agnostic interfaces for the adaptive learning engine.
 */

// ── Learner ─────────────────────────────────────────────────────────

export interface ILearner {
  userId: string
  timezone: string
  preferredChannels: string[]
  optOutChannels: string[]
  optimalPracticeTime: string | null
  practiceTimeConfidence: number
  avgSessionsPerWeek: number
  engagementScore: number
  weakSkills: string[]
  strongSkills: string[]
  notificationFrequency: 'quiet' | 'normal' | 'active'
}

// ── Content ─────────────────────────────────────────────────────────

export interface IContentItem {
  type: 'lesson' | 'arcade' | 'practice' | 'quiz' | 'mini_game'
  contentId: string
  title: string
  skillCategory?: string
  difficulty?: string
  estimatedMinutes?: number
  deepLink: string
}

export interface IContentProvider {
  getNextLessons(userId: string, limit: number): Promise<IContentItem[]>
  getSkillPractice(userId: string, skill: string): Promise<IContentItem[]>
  getArcadeChallenges(userId: string, limit: number): Promise<IContentItem[]>
}

// ── Notifications ───────────────────────────────────────────────────

export type TriggerType =
  | 'morning_motivation'
  | 'streak_warning'
  | 'streak_broken'
  | 'comeback'
  | 'level_up'
  | 'badge_earned'
  | 'leaderboard_change'
  | 'skill_gap_nudge'
  | 'weekly_report'
  | 'social_nudge'
  | 'celebration'
  | 'new_content'

export interface NotificationPayload {
  triggerType: TriggerType
  title: string
  body: string
  deepLink?: string
  priority: 'low' | 'normal' | 'high'
  metadata?: Record<string, unknown>
}

export interface DeliveryResult {
  success: boolean
  channel: string
  messageId?: string
  error?: string
}

export interface INotificationChannel {
  readonly name: string
  send(userId: string, payload: NotificationPayload): Promise<DeliveryResult>
  isAvailable(userId: string): Promise<boolean>
}

// ── Analyzers ───────────────────────────────────────────────────────

export interface ProgressSnapshot {
  lessonsThisWeek: number
  avgQuizScore: number
  arcadeScores: { avg: number; count: number }
  questCompletionRate: number
  xpVelocity: number // XP per day over last 7 days
}

export interface EngagementSnapshot {
  engagementScore: number
  optimalPracticeTime: string | null
  practiceTimeConfidence: number
  daysSinceLastActivity: number
  isDropping: boolean
}

export interface SkillGapSnapshot {
  weakSkills: string[]
  strongSkills: string[]
  neglectedSkills: string[]
  daysSinceBySkill: Record<string, number>
  /** I3: Clips due for spaced review */
  clipsReadyForReview?: {
    clipId: string
    clipTitle: string
    skillCategory: string
    lastScore: number
    nextReviewAt: Date | null
  }[]
}

// ── Planners ────────────────────────────────────────────────────────

export interface PlannedActivity {
  type: 'lesson' | 'arcade' | 'practice' | 'quiz' | 'mini_game' | 'review'
  contentId: string
  title: string
  reason: string
  priority: number // 1 = highest
  deepLink: string
}

export interface LearnerContext {
  learner: ILearner
  progress: ProgressSnapshot
  engagement: EngagementSnapshot
  skillGaps: SkillGapSnapshot
}

// ── Engine Config ───────────────────────────────────────────────────

export interface EngineConfig {
  morningCycleHour: number      // hour in user's timezone to run morning cycle
  eveningCycleHour: number      // hour in user's timezone for streak warnings
  maxNotificationsPerDay: number
  minEngagementForNudge: number // don't nudge users above this score
  streakWarningHours: number    // hours before midnight to send streak warning
  comebackThresholdDays: number // days inactive before comeback message
  weeklyReportDay: number       // 0=Sun, 1=Mon...
  batchSize: number             // notification queue batch size
  maxRetries: number
  retryDelayMinutes: number
  gptModel: string              // for motivation text generation
}
