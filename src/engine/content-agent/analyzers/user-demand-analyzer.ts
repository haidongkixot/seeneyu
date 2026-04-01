import { prisma } from '@/lib/prisma'
import type { DemandAnalysis } from '../types'

export async function analyzeUserDemand(): Promise<DemandAnalysis> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Count practice sessions by skill category (last 30 days)
  const sessions = await prisma.userSession.groupBy({
    by: ['clipId'],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  })

  // Resolve clip skill categories
  const clipIds = sessions.map(s => s.clipId)
  const clips = await prisma.clip.findMany({
    where: { id: { in: clipIds } },
    select: { id: true, skillCategory: true },
  })
  const clipSkillMap = new Map(clips.map(c => [c.id, c.skillCategory]))

  const practiceBySkill: Record<string, number> = {}
  for (const session of sessions) {
    const skill = clipSkillMap.get(session.clipId) ?? 'unknown'
    practiceBySkill[skill] = (practiceBySkill[skill] ?? 0) + session._count
  }

  // Count arcade attempts by challenge type (last 30 days)
  const attempts = await prisma.arcadeAttempt.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { challenge: { select: { type: true } } },
  })
  const attemptsBySkill: Record<string, number> = {}
  for (const a of attempts) {
    const type = a.challenge.type
    attemptsBySkill[type] = (attemptsBySkill[type] ?? 0) + 1
  }

  // Count foundation progress by course (last 30 days)
  const progress = await prisma.foundationProgress.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { lesson: { select: { course: { select: { title: true } } } } },
  })
  const progressBySkill: Record<string, number> = {}
  for (const p of progress) {
    const courseTitle = p.lesson.course.title
    progressBySkill[courseTitle] = (progressBySkill[courseTitle] ?? 0) + 1
  }

  // Count active vs total users
  const totalUsers = await prisma.user.count({ where: { status: 'approved' } })
  const activeUserIds = await prisma.activityEvent.findMany({
    where: { createdAt: { gte: thirtyDaysAgo }, userId: { not: null } },
    select: { userId: true },
    distinct: ['userId'],
  })
  const activeUsers = activeUserIds.length

  return { practiceBySkill, attemptsBySkill, progressBySkill, activeUsers, totalUsers }
}
