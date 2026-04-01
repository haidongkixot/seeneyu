import { prisma } from '@/lib/prisma'
import { analyzeContentCoverage } from './analyzers/content-coverage-analyzer'
import { analyzeUserDemand } from './analyzers/user-demand-analyzer'
import { prioritizeGaps } from './analyzers/gap-prioritizer'
import { generateSuggestions } from './suggestion-engine'

export async function runAnalysisCycle(type: 'daily' | 'weekly' = 'weekly') {
  // Create cycle record
  const cycle = await prisma.contentAgentCycle.create({
    data: { type, status: 'analyzing' },
  })

  try {
    // Run analyzers
    const coverage = await analyzeContentCoverage()
    const demand = await analyzeUserDemand()
    const analysis = prioritizeGaps(coverage, demand)

    // Save gap snapshot
    await prisma.contentGapSnapshot.create({
      data: {
        cycleId: cycle.id,
        skillCoverage: analysis.snapshot.skillCoverage as any,
        difficultyCoverage: analysis.snapshot.difficultyCoverage as any,
        practiceFrequency: analysis.snapshot.practiceFrequency as any,
        contentFreshness: analysis.snapshot.contentFreshness as any,
        activeUsers: analysis.snapshot.activeUsers,
        totalUsers: analysis.snapshot.totalUsers,
      },
    })

    // Generate suggestions from gaps
    const suggestions = await generateSuggestions(cycle.id, analysis.gaps)

    // Calculate total cost estimate
    const costEstimate = suggestions.reduce((sum, s) => sum + (s.estimatedCost ?? 0), 0)

    // Update cycle
    await prisma.contentAgentCycle.update({
      where: { id: cycle.id },
      data: {
        status: 'suggestions_ready',
        analysisData: analysis as any,
        suggestionsCount: suggestions.length,
        costEstimate,
      },
    })

    return { cycleId: cycle.id, suggestionsCount: suggestions.length, costEstimate }
  } catch (error) {
    await prisma.contentAgentCycle.update({
      where: { id: cycle.id },
      data: { status: 'failed', errorMessage: String(error) },
    })
    throw error
  }
}
