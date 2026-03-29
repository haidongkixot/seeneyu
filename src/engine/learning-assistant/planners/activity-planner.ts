import { prisma } from '@/lib/prisma'
import type { PlannedActivity, LearnerContext } from '../core/types'

/**
 * Generates a daily learning plan of 3-5 activities tailored to the learner.
 * Prioritizes: skill gaps > current path > variety.
 */
export async function generateDailyPlan(
  userId: string,
  ctx: LearnerContext
): Promise<PlannedActivity[]> {
  const activities: PlannedActivity[] = []

  // 1. Fill skill gaps — suggest lessons/arcade for weak skills
  if (ctx.skillGaps.weakSkills.length > 0) {
    const weakSkill = ctx.skillGaps.weakSkills[0]
    const lesson = await findLessonForSkill(userId, weakSkill)
    if (lesson) {
      activities.push({
        type: 'lesson',
        contentId: lesson.id,
        title: lesson.title,
        reason: `Strengthen your ${formatSkill(weakSkill)} skills`,
        priority: 1,
        deepLink: `/foundation/${lesson.courseSlug}/${lesson.slug}`,
      })
    }
  }

  // 2. Continue current learning path — next uncompleted lesson
  const nextLesson = await findNextLesson(userId)
  if (nextLesson && !activities.find(a => a.contentId === nextLesson.id)) {
    activities.push({
      type: 'lesson',
      contentId: nextLesson.id,
      title: nextLesson.title,
      reason: 'Continue your current learning path',
      priority: 2,
      deepLink: `/foundation/${nextLesson.courseSlug}/${nextLesson.slug}`,
    })
  }

  // 3. Arcade challenge for variety
  const arcadeChallenge = await findArcadeChallenge(userId)
  if (arcadeChallenge) {
    activities.push({
      type: 'arcade',
      contentId: arcadeChallenge.id,
      title: arcadeChallenge.title,
      reason: 'Practice with a fun challenge',
      priority: 3,
      deepLink: `/arcade/${arcadeChallenge.bundleId}`,
    })
  }

  // 4. Neglected skill nudge
  if (ctx.skillGaps.neglectedSkills.length > 0) {
    const neglected = ctx.skillGaps.neglectedSkills[0]
    const lesson = await findLessonForSkill(userId, neglected)
    if (lesson && !activities.find(a => a.contentId === lesson.id)) {
      activities.push({
        type: 'review',
        contentId: lesson.id,
        title: lesson.title,
        reason: `You haven't practiced ${formatSkill(neglected)} in a while`,
        priority: 4,
        deepLink: `/foundation/${lesson.courseSlug}/${lesson.slug}`,
      })
    }
  }

  // 5. Quick activity — daily quest or mini-game
  if (activities.length < 4) {
    activities.push({
      type: 'mini_game',
      contentId: 'daily-quest',
      title: 'Complete your daily quests',
      reason: 'Quick wins to keep your streak going',
      priority: 5,
      deepLink: '/dashboard',
    })
  }

  return activities.slice(0, 5)
}

// ── Helpers ─────────────────────────────────────────────────────────

interface LessonResult {
  id: string
  title: string
  slug: string
  courseSlug: string
}

async function findLessonForSkill(userId: string, skill: string): Promise<LessonResult | null> {
  // Find a course matching this skill that has uncompleted lessons
  const course = await prisma.foundationCourse.findFirst({
    where: {
      title: { contains: skill.replace('_', ' '), mode: 'insensitive' },
    },
    select: {
      slug: true,
      lessons: {
        select: { id: true, title: true, slug: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!course || course.lessons.length === 0) return null

  // Find first uncompleted lesson in this course
  const completedIds = await prisma.foundationProgress.findMany({
    where: {
      userId,
      lessonId: { in: course.lessons.map(l => l.id) },
      completedAt: { not: null },
    },
    select: { lessonId: true },
  })

  const completedSet = new Set(completedIds.map(c => c.lessonId))
  const uncompleted = course.lessons.find(l => !completedSet.has(l.id))
  const target = uncompleted ?? course.lessons[0] // review first if all done

  return {
    id: target.id,
    title: target.title,
    slug: target.slug,
    courseSlug: course.slug,
  }
}

async function findNextLesson(userId: string): Promise<LessonResult | null> {
  // Get all courses in order
  const courses = await prisma.foundationCourse.findMany({
    orderBy: { order: 'asc' },
    select: {
      slug: true,
      lessons: {
        select: { id: true, title: true, slug: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  // Get completed lessons
  const completed = await prisma.foundationProgress.findMany({
    where: { userId, completedAt: { not: null } },
    select: { lessonId: true },
  })
  const completedSet = new Set(completed.map(c => c.lessonId))

  // Find first uncompleted lesson across all courses
  for (const course of courses) {
    for (const lesson of course.lessons) {
      if (!completedSet.has(lesson.id)) {
        return {
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          courseSlug: course.slug,
        }
      }
    }
  }

  return null
}

async function findArcadeChallenge(
  userId: string
): Promise<{ id: string; title: string; bundleId: string } | null> {
  // Find a challenge the user hasn't attempted or scored low on
  const recentAttempts = await prisma.arcadeAttempt.findMany({
    where: { userId },
    select: { challengeId: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const attemptedIds = new Set(recentAttempts.map(a => a.challengeId))

  const challenge = await prisma.arcadeChallenge.findFirst({
    where: {
      id: { notIn: Array.from(attemptedIds) },
      bundle: { /* any active bundle */ },
    },
    select: { id: true, title: true, bundleId: true },
    orderBy: { orderIndex: 'asc' },
  })

  return challenge
}

function formatSkill(skill: string): string {
  return skill.replace(/_/g, ' ')
}
