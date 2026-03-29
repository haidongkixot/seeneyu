import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'
import { getEngine } from '@/engine/learning-assistant'

/**
 * GET /api/learning-plan
 * Returns today's learning plan for the authenticated user.
 * Auto-creates a plan if none exists for today.
 */
export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authUser.id
  const today = new Date().toISOString().slice(0, 10)

  // Try to find existing plan
  let plan = await prisma.learningPlan.findUnique({
    where: { userId_type_date: { userId, type: 'daily', date: today } },
  })

  // Auto-create if missing
  if (!plan) {
    try {
      const engine = getEngine()
      const ctx = await buildMinimalContext(userId)
      const { generateDailyPlan } = await import('@/engine/learning-assistant/planners/activity-planner')
      const activities = await generateDailyPlan(userId, ctx)

      plan = await prisma.learningPlan.create({
        data: {
          userId,
          type: 'daily',
          date: today,
          activities: activities as object[],
          totalCount: activities.length,
        },
      })
    } catch {
      return NextResponse.json({
        plan: null,
        activities: [],
        date: today,
      })
    }
  }

  return NextResponse.json({
    plan: {
      id: plan.id,
      date: plan.date,
      status: plan.status,
      completedCount: plan.completedCount,
      totalCount: plan.totalCount,
    },
    activities: plan.activities,
    date: today,
  })
}

async function buildMinimalContext(userId: string) {
  const { analyzeProgress } = await import('@/engine/learning-assistant/analyzers/progress-analyzer')
  const { analyzeEngagement } = await import('@/engine/learning-assistant/analyzers/engagement-analyzer')
  const { analyzeSkillGaps } = await import('@/engine/learning-assistant/analyzers/skill-gap-analyzer')

  const [progress, engagement, skillGaps] = await Promise.all([
    analyzeProgress(userId),
    analyzeEngagement(userId),
    analyzeSkillGaps(userId),
  ])

  const profile = await prisma.learnerProfile.findUnique({ where: { userId } })

  return {
    learner: {
      userId,
      timezone: profile?.timezone || 'UTC',
      preferredChannels: (profile?.preferredChannels as string[]) || [],
      optOutChannels: (profile?.optOutChannels as string[]) || [],
      optimalPracticeTime: profile?.optimalPracticeTime || null,
      practiceTimeConfidence: profile?.practiceTimeConfidence || 0,
      avgSessionsPerWeek: profile?.avgSessionsPerWeek || 0,
      engagementScore: profile?.engagementScore || 50,
      weakSkills: (profile?.weakSkills as string[]) || [],
      strongSkills: (profile?.strongSkills as string[]) || [],
      notificationFrequency: (profile?.notificationFrequency || 'normal') as 'quiet' | 'normal' | 'active',
    },
    progress,
    engagement,
    skillGaps,
  }
}
