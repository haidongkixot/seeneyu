import { prisma } from '@/lib/prisma'
import type { ContentGap } from './types'
import { DEFAULT_AGENT_CONFIG, COST_TABLE, SKILL_TO_EXPRESSIONS, SKILL_TO_BODY_LANGUAGE } from './config'

function selectProvider(mediaType: 'image' | 'video'): { provider: string; cost: number } {
  // Select cheapest available provider
  const providers = Object.entries(COST_TABLE)
    .filter(([, costs]) => costs[mediaType] !== null)
    .sort((a, b) => (a[1][mediaType] ?? 999) - (b[1][mediaType] ?? 999))

  if (providers.length === 0) {
    return { provider: 'pollinations', cost: 0 }
  }

  const [provider, costs] = providers[0]
  return { provider, cost: costs[mediaType] ?? 0 }
}

export async function generateSuggestions(
  cycleId: string,
  gaps: ContentGap[],
): Promise<Array<{ id: string; estimatedCost: number }>> {
  const config = DEFAULT_AGENT_CONFIG
  const maxSuggestions = config.maxSuggestionsPerCycle

  // Take top priority gaps up to the limit
  const topGaps = gaps.slice(0, maxSuggestions)
  const results: Array<{ id: string; estimatedCost: number }> = []

  for (const gap of topGaps) {
    // Determine media type based on skill
    const mediaType = config.preferVideoForSkills.includes(gap.skillCategory) ? 'video' : 'image'

    // Select expression type for this skill
    const expressions = SKILL_TO_EXPRESSIONS[gap.skillCategory] ?? ['neutral']
    const expressionType = expressions[Math.floor(Math.random() * expressions.length)]

    // Get body language type
    const bodyLanguageType = SKILL_TO_BODY_LANGUAGE[gap.skillCategory] ?? gap.skillCategory

    // Select provider and estimate cost
    const { provider, cost } = selectProvider(mediaType)

    const suggestion = await prisma.contentSuggestion.create({
      data: {
        cycleId,
        expressionType,
        bodyLanguageType,
        skillCategory: gap.skillCategory,
        difficulty: gap.difficulty,
        rationale: gap.rationale,
        gapType: gap.gapType,
        priority: gap.priority,
        suggestedProvider: provider,
        mediaType,
        classification: config.defaultClassification,
        publishTargets: config.defaultPublishTargets,
        estimatedCost: cost,
        status: 'pending',
      },
    })

    results.push({ id: suggestion.id, estimatedCost: cost })
  }

  return results
}
