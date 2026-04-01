import { prisma } from '@/lib/prisma'
import type { CoverageAnalysis, SkillCoverage } from '../types'
import { SKILL_CATEGORIES } from '../types'

export async function analyzeContentCoverage(): Promise<CoverageAnalysis> {
  // Query clips grouped by skillCategory and difficulty
  const clips = await prisma.clip.groupBy({
    by: ['skillCategory', 'difficulty'],
    where: { isActive: true },
    _count: true,
  })

  // Build clipsBySkill map
  const clipsBySkill: Record<string, SkillCoverage> = {}
  for (const skill of SKILL_CATEGORIES) {
    const coverage: SkillCoverage = { total: 0, beginner: 0, intermediate: 0, advanced: 0 }
    for (const row of clips) {
      if (row.skillCategory === skill) {
        const diff = row.difficulty as keyof SkillCoverage
        if (diff in coverage) {
          coverage[diff] = row._count
          coverage.total += row._count
        }
      }
    }
    clipsBySkill[skill] = coverage
  }

  // Query arcade challenges by type (facial maps to expression skills, gesture to posture)
  const arcadeChallenges = await prisma.arcadeChallenge.groupBy({
    by: ['type'],
    _count: true,
  })
  const arcadeBySkill: Record<string, number> = {}
  for (const row of arcadeChallenges) {
    arcadeBySkill[row.type] = row._count
  }

  // Query lesson examples count per course (proxy for skill coverage)
  const lessonExamples = await (prisma as any).lessonExample.count()
  const lessonsBySkill: Record<string, number> = {}
  // Simplified: distribute evenly for now
  for (const skill of SKILL_CATEGORIES) {
    lessonsBySkill[skill] = Math.floor(lessonExamples / SKILL_CATEGORIES.length)
  }

  return { clipsBySkill, arcadeBySkill, lessonsBySkill }
}
