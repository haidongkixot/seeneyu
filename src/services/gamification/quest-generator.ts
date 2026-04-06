import { prisma } from '@/lib/prisma'
import type { DailyQuest } from '@prisma/client'
import { awardXp } from './xp-engine'

interface QuestTemplate {
  questType: string
  description: string
  target: number
  xpReward: number
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  { questType: 'complete_arcade', description: 'Complete an arcade challenge', target: 1, xpReward: 50 },
  { questType: 'complete_arcade', description: 'Complete 3 arcade challenges', target: 3, xpReward: 75 },
  { questType: 'finish_lesson', description: 'Finish a foundation lesson', target: 1, xpReward: 50 },
  { questType: 'finish_lesson', description: 'Complete 2 foundation lessons', target: 2, xpReward: 75 },
  { questType: 'practice_skill', description: 'Complete a practice session', target: 1, xpReward: 50 },
  { questType: 'practice_skill', description: 'Practice 3 skills', target: 3, xpReward: 75 },
  { questType: 'play_minigame', description: 'Play a mini-game', target: 1, xpReward: 40 },
  { questType: 'play_minigame', description: 'Play 3 mini-games', target: 3, xpReward: 60 },
  { questType: 'post_comment', description: 'Post a comment or reply', target: 1, xpReward: 30 },
  { questType: 'post_comment', description: 'Post 3 comments', target: 3, xpReward: 50 },
  { questType: 'complete_reviews', description: 'Complete a scheduled review', target: 1, xpReward: 40 },
  { questType: 'complete_reviews', description: 'Complete 3 scheduled reviews', target: 3, xpReward: 75 },
]

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Shuffle array using Fisher-Yates and return first N items.
 */
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

/**
 * Generate 3 daily quests for a user. Ensures variety by picking
 * different quest types. Idempotent — returns existing quests if already generated.
 */
export async function generateDailyQuests(userId: string): Promise<DailyQuest[]> {
  const today = getTodayDate()

  // Check if quests already exist for today
  const existing = await prisma.dailyQuest.findMany({
    where: { userId, date: today },
  })
  if (existing.length > 0) return existing

  // Pick 3 quests with different types for variety
  const usedTypes = new Set<string>()
  const selected: QuestTemplate[] = []
  const shuffled = pickRandom(QUEST_TEMPLATES, QUEST_TEMPLATES.length)

  for (const tmpl of shuffled) {
    if (selected.length >= 3) break
    if (usedTypes.has(tmpl.questType)) continue
    usedTypes.add(tmpl.questType)
    selected.push(tmpl)
  }

  // Create all 3 quests
  const quests = await Promise.all(
    selected.map((tmpl) =>
      prisma.dailyQuest.create({
        data: {
          userId,
          date: today,
          questType: tmpl.questType,
          description: tmpl.description,
          target: tmpl.target,
          xpReward: tmpl.xpReward,
        },
      })
    )
  )

  return quests
}

/**
 * Update progress on a quest of the given type. Awards XP if quest is completed.
 * Also awards a bonus if all 3 daily quests are now complete.
 */
export async function updateQuestProgress(
  userId: string,
  questType: string,
  increment: number = 1
): Promise<{ quest: DailyQuest | null; completed: boolean; xpAwarded: number }> {
  const today = getTodayDate()

  // Find the matching incomplete quest for today
  const quest = await prisma.dailyQuest.findFirst({
    where: { userId, date: today, questType, completed: false },
  })

  if (!quest) {
    return { quest: null, completed: false, xpAwarded: 0 }
  }

  const newProgress = Math.min(quest.progress + increment, quest.target)
  const completed = newProgress >= quest.target

  const updated = await prisma.dailyQuest.update({
    where: { id: quest.id },
    data: {
      progress: newProgress,
      completed,
    },
  })

  let xpAwarded = 0

  if (completed) {
    await awardXp(userId, quest.xpReward, 'daily_quest', quest.id)
    xpAwarded += quest.xpReward

    // Check if all 3 daily quests are now complete for the bonus
    const allQuests = await prisma.dailyQuest.findMany({
      where: { userId, date: today },
    })
    const allDone = allQuests.length >= 3 && allQuests.every((q) => q.completed)
    if (allDone) {
      await awardXp(userId, 100, 'daily_quest_all_bonus')
      xpAwarded += 100
    }
  }

  return { quest: updated, completed, xpAwarded }
}

/**
 * Get today's quests for a user.
 */
export async function getTodayQuests(userId: string): Promise<DailyQuest[]> {
  const today = getTodayDate()
  return prisma.dailyQuest.findMany({
    where: { userId, date: today },
    orderBy: { createdAt: 'asc' },
  })
}
