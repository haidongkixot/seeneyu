import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { SkillCategory } from '@/lib/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const completedSessions = await prisma.userSession.findMany({
    where: {
      userId,
      status: 'complete',
      feedback: { not: Prisma.JsonNull },
    },
    include: {
      clip: {
        select: {
          id: true,
          movieTitle: true,
          skillCategory: true,
          difficulty: true,
        },
      },
    },
    orderBy: { completedAt: 'asc' },
  })

  // ── Per-skill aggregates ────────────────────────────────────
  const skillMap: Record<
    string,
    { totalScore: number; count: number; scores: number[] }
  > = {}

  // ── Per-clip breakdown ──────────────────────────────────────
  const clipMap: Record<
    string,
    { movieTitle: string; skill: string; scores: number[]; dates: string[] }
  > = {}

  for (const s of completedSessions) {
    const fb = s.feedback as { overallScore?: number } | null
    const score = fb?.overallScore
    if (score == null) continue

    const skill = s.clip.skillCategory as SkillCategory

    // Skill stats
    if (!skillMap[skill]) skillMap[skill] = { totalScore: 0, count: 0, scores: [] }
    skillMap[skill].totalScore += score
    skillMap[skill].count += 1
    skillMap[skill].scores.push(score)

    // Clip stats
    if (!clipMap[s.clipId]) {
      clipMap[s.clipId] = {
        movieTitle: s.clip.movieTitle,
        skill,
        scores: [],
        dates: [],
      }
    }
    clipMap[s.clipId].scores.push(score)
    clipMap[s.clipId].dates.push(
      s.completedAt ? new Date(s.completedAt).toISOString() : '',
    )
  }

  // Build skill response with trend
  const skills: Record<
    string,
    { avgScore: number; sessionCount: number; trend: 'up' | 'down' | 'flat' }
  > = {}

  for (const [skill, stats] of Object.entries(skillMap)) {
    const avgScore = Math.round(stats.totalScore / stats.count)
    let trend: 'up' | 'down' | 'flat' = 'flat'
    if (stats.scores.length >= 2) {
      const first = stats.scores[0]
      const last = stats.scores[stats.scores.length - 1]
      const diff = last - first
      if (diff > 3) trend = 'up'
      else if (diff < -3) trend = 'down'
    }
    skills[skill] = { avgScore, sessionCount: stats.count, trend }
  }

  return NextResponse.json(
    { skills, clips: clipMap },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    },
  )
}
