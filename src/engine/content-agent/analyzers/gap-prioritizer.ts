import type { ContentGap, CoverageAnalysis, DemandAnalysis, GapAnalysis } from '../types'
import { SKILL_CATEGORIES, DIFFICULTIES } from '../types'

export function prioritizeGaps(
  coverage: CoverageAnalysis,
  demand: DemandAnalysis,
): GapAnalysis {
  const gaps: ContentGap[] = []

  for (const skill of SKILL_CATEGORIES) {
    const skillCoverage = coverage.clipsBySkill[skill] ?? { total: 0, beginner: 0, intermediate: 0, advanced: 0 }
    const demandCount = (demand.practiceBySkill[skill] ?? 0) + (demand.attemptsBySkill[skill] ?? 0)

    for (const difficulty of DIFFICULTIES) {
      const existingCount = skillCoverage[difficulty] ?? 0
      const demandScore = demandCount > 0 ? demandCount : 1

      // Calculate gap score: high demand + low content = high priority
      let gapType: ContentGap['gapType'] = 'content_variety'
      let rationale = ''

      if (existingCount === 0) {
        gapType = 'skill_gap'
        rationale = `No ${difficulty} content exists for ${skill}. Users have ${demandCount} practice sessions in this skill area.`
      } else if (existingCount < 3) {
        gapType = 'difficulty_gap'
        rationale = `Only ${existingCount} ${difficulty} clips for ${skill}. More variety needed to maintain learner engagement.`
      } else if (demandCount > existingCount * 10) {
        gapType = 'engagement_gap'
        rationale = `High demand (${demandCount} sessions) but only ${existingCount} ${difficulty} clips for ${skill}. Content is being overused.`
      } else {
        // Lower priority — content exists and demand is met
        rationale = `${existingCount} ${difficulty} clips for ${skill} with ${demandCount} recent sessions. Minor refresh recommended.`
      }

      // Priority formula: lower number = higher priority
      const contentPenalty = existingCount === 0 ? 10 : Math.min(existingCount, 5)
      const demandBonus = Math.min(Math.log2(demandScore + 1), 5)
      const rawPriority = 10 - demandBonus + contentPenalty * 0.5
      const priority = Math.max(1, Math.min(10, Math.round(rawPriority)))

      // Only include gaps that are actionable (score below threshold)
      if (existingCount < 5 || demandCount > existingCount * 10) {
        gaps.push({
          skillCategory: skill,
          difficulty,
          gapType,
          existingCount,
          demandScore,
          freshnessDays: 0, // TODO: compute from latest Clip.createdAt per skill
          priority,
          rationale,
        })
      }
    }
  }

  // Sort by priority (1 = highest priority first)
  gaps.sort((a, b) => a.priority - b.priority)

  // Build snapshot data
  const skillCoverage = coverage.clipsBySkill
  const difficultyCoverage: Record<string, number> = {}
  for (const diff of DIFFICULTIES) {
    difficultyCoverage[diff] = Object.values(skillCoverage).reduce(
      (sum, sc) => sum + (sc[diff] ?? 0), 0
    )
  }
  const practiceFrequency = { ...demand.practiceBySkill }
  const contentFreshness: Record<string, number> = {}
  for (const skill of SKILL_CATEGORIES) {
    contentFreshness[skill] = 0 // placeholder
  }

  return {
    gaps,
    snapshot: {
      skillCoverage,
      difficultyCoverage,
      practiceFrequency,
      contentFreshness,
      activeUsers: demand.activeUsers,
      totalUsers: demand.totalUsers,
    },
  }
}
