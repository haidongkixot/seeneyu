export { XP_AMOUNTS, getLevel, getXpForNextLevel, getTotalXpForLevel, awardXp } from './xp-engine'
export { checkAndUpdateStreak, useStreakFreeze } from './streak-tracker'
export { getHearts, deductHeart, refillHearts } from './hearts-manager'
export { generateDailyQuests, updateQuestProgress, getTodayQuests } from './quest-generator'
export { evaluateBadges, checkBadgeCriteria } from './badge-evaluator'

import { awardXp, XP_AMOUNTS } from './xp-engine'
import { checkAndUpdateStreak } from './streak-tracker'
import { updateQuestProgress } from './quest-generator'
import { evaluateBadges } from './badge-evaluator'
import type { Badge } from '@prisma/client'

// Map activity types to quest types for progress tracking
const ACTIVITY_TO_QUEST: Record<string, string> = {
  arcade_challenge: 'complete_arcade',
  arcade_bundle_complete: 'complete_arcade',
  foundation_lesson: 'finish_lesson',
  foundation_quiz_perfect: 'finish_lesson',
  practice_session: 'practice_skill',
  full_performance: 'practice_skill',
  mini_game: 'play_minigame',
  post_comment: 'post_comment',
}

export interface ActivityResult {
  xpGained: number
  leveledUp: boolean
  newLevel: number
  streakContinued: boolean
  currentStreak: number
  questsCompleted: string[]
  badgesEarned: Badge[]
}

/**
 * Process a user activity: award XP, update streak, check quests, evaluate badges.
 * This is the primary convenience function that orchestrates all gamification logic.
 */
export async function processActivity(
  userId: string,
  activityType: string,
  metadata?: { sourceId?: string; [key: string]: unknown }
): Promise<ActivityResult> {
  // 1. Award XP
  const xpAmount = XP_AMOUNTS[activityType] ?? 10
  const xpResult = await awardXp(
    userId,
    xpAmount,
    activityType,
    metadata?.sourceId as string | undefined,
    metadata
  )

  // 2. Update streak
  const streakResult = await checkAndUpdateStreak(userId)

  // 3. Update quest progress
  const questType = ACTIVITY_TO_QUEST[activityType]
  const questsCompleted: string[] = []
  if (questType) {
    const questResult = await updateQuestProgress(userId, questType)
    if (questResult.completed && questResult.quest) {
      questsCompleted.push(questResult.quest.questType)
    }
  }

  // 4. Evaluate badges
  const badgesEarned = await evaluateBadges(userId)

  return {
    xpGained: xpAmount,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.level,
    streakContinued: streakResult.continued,
    currentStreak: streakResult.currentStreak,
    questsCompleted,
    badgesEarned,
  }
}
