import { prisma } from '@/lib/prisma'
import type { SkillGapSnapshot } from '../core/types'
import { SKILL_CATEGORIES } from '../core/config'

/**
 * Analyzes skill gaps by examining practice history per skill category.
 * Identifies weak, strong, and neglected skills.
 */
export async function analyzeSkillGaps(userId: string): Promise<SkillGapSnapshot> {
  // Fetch all arcade attempts with challenge skill info
  const [arcadeAttempts, lessonProgress, skillBaselines] = await Promise.all([
    prisma.arcadeAttempt.findMany({
      where: { userId },
      select: {
        score: true,
        createdAt: true,
        challenge: {
          select: { type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.foundationProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: {
        completedAt: true,
        quizScore: true,
        lesson: {
          select: {
            course: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.skillBaseline.findMany({
      where: { userId },
      select: { skillCategory: true, level: true },
    }),
  ])

  const now = Date.now()
  const dayMs = 1000 * 60 * 60 * 24

  // Track scores and last practice per skill
  const skillScores: Record<string, number[]> = {}
  const skillLastPractice: Record<string, Date> = {}

  // Process arcade attempts (type maps roughly to skill category)
  for (const attempt of arcadeAttempts) {
    const skill = attempt.challenge.type // 'facial' | 'gesture'
    const mappedSkill = skill === 'facial' ? 'facial_expressions' : 'gestures'
    if (!skillScores[mappedSkill]) skillScores[mappedSkill] = []
    skillScores[mappedSkill].push(attempt.score)
    if (!skillLastPractice[mappedSkill] || attempt.createdAt > skillLastPractice[mappedSkill]) {
      skillLastPractice[mappedSkill] = attempt.createdAt
    }
  }

  // Process lesson progress (course title often maps to skill)
  for (const prog of lessonProgress) {
    if (!prog.completedAt) continue
    const courseTitle = prog.lesson.course.title.toLowerCase()
    // Try to map course title to skill category
    const matchedSkill = SKILL_CATEGORIES.find(cat =>
      courseTitle.includes(cat.replace('_', ' '))
    )
    if (matchedSkill) {
      if (!skillScores[matchedSkill]) skillScores[matchedSkill] = []
      skillScores[matchedSkill].push(prog.quizScore ?? 50)
      if (!skillLastPractice[matchedSkill] || prog.completedAt > skillLastPractice[matchedSkill]) {
        skillLastPractice[matchedSkill] = prog.completedAt
      }
    }
  }

  // Classify skills
  const weakSkills: string[] = []
  const strongSkills: string[] = []
  const neglectedSkills: string[] = []
  const daysSinceBySkill: Record<string, number> = {}

  for (const skill of SKILL_CATEGORIES) {
    const scores = skillScores[skill]
    const lastPractice = skillLastPractice[skill]

    if (lastPractice) {
      daysSinceBySkill[skill] = Math.floor((now - lastPractice.getTime()) / dayMs)
    } else {
      daysSinceBySkill[skill] = 999
    }

    // Never practiced = neglected
    if (!scores || scores.length === 0) {
      // Check if baseline exists
      const baseline = skillBaselines.find(b => b.skillCategory === skill)
      if (baseline) {
        neglectedSkills.push(skill)
      }
      continue
    }

    // Recent scores (last 5)
    const recentScores = scores.slice(0, 5)
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length

    if (avg < 50) {
      weakSkills.push(skill)
    } else if (avg >= 75) {
      strongSkills.push(skill)
    }

    // Neglected = has scores but not practiced in 14+ days
    if (daysSinceBySkill[skill] >= 14) {
      neglectedSkills.push(skill)
    }
  }

  return {
    weakSkills,
    strongSkills,
    neglectedSkills,
    daysSinceBySkill,
  }
}
