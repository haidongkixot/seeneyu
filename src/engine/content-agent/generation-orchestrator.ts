import { prisma } from '@/lib/prisma'
import { generateDescription } from '@/toolkit/ai-content-generator/services/description-generator'

export async function processApprovedSuggestions(cycleId: string): Promise<number> {
  const suggestions = await prisma.contentSuggestion.findMany({
    where: { cycleId, status: 'approved' },
  })

  let jobCount = 0

  for (const suggestion of suggestions) {
    try {
      // Generate description + prompts via GPT-4o-mini
      let description: any = null
      try {
        description = await generateDescription(
          suggestion.expressionType,
          suggestion.bodyLanguageType,
        )
      } catch {
        // Use fallback prompts if GPT fails
      }

      // Create AiContentRequest (reuse existing model)
      const contentRequest = await prisma.aiContentRequest.create({
        data: {
          expressionType: suggestion.expressionType,
          bodyLanguageType: suggestion.bodyLanguageType,
          generatedDescription: description,
          imagePrompt: description?.imagePrompt ?? `${suggestion.expressionType} expression with ${suggestion.bodyLanguageType} body language, professional photography`,
          videoPrompt: description?.videoPrompt ?? `Person demonstrating ${suggestion.bodyLanguageType} while showing ${suggestion.expressionType}`,
          provider: suggestion.suggestedProvider ?? 'pollinations',
          status: 'generating',
          createdBy: 'content-agent',
        },
      })

      // Link suggestion to content request
      await prisma.contentSuggestion.update({
        where: { id: suggestion.id },
        data: { contentRequestId: contentRequest.id, status: 'generating' },
      })

      // Create generation job
      await prisma.agentGenerationJob.create({
        data: {
          suggestionId: suggestion.id,
          contentRequestId: contentRequest.id,
          provider: suggestion.suggestedProvider ?? 'pollinations',
          model: suggestion.suggestedModel,
          status: 'queued',
        },
      })

      jobCount++
    } catch (error) {
      await prisma.contentSuggestion.update({
        where: { id: suggestion.id },
        data: { status: 'failed' },
      })
      console.error(`Failed to create job for suggestion ${suggestion.id}:`, error)
    }
  }

  // Update cycle counts
  await prisma.contentAgentCycle.update({
    where: { id: cycleId },
    data: { status: 'generating', approvedCount: suggestions.length },
  })

  return jobCount
}
