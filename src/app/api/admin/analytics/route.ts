import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET() {
  try {
    await requireAdmin()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total users
    const totalUsers = await prisma.user.count()

    // DAU — unique users with activity today
    const dauResult = await (prisma as any).activityEvent.findMany({
      where: { createdAt: { gte: todayStart }, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    })
    const dau = dauResult.length

    // WAU — unique users with activity in last 7 days
    const wauResult = await (prisma as any).activityEvent.findMany({
      where: { createdAt: { gte: weekAgo }, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    })
    const wau = wauResult.length

    // MAU — unique users with activity in last 30 days
    const mauResult = await (prisma as any).activityEvent.findMany({
      where: { createdAt: { gte: monthAgo }, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    })
    const mau = mauResult.length

    // Sessions today
    const sessionsToday = await (prisma as any).activityEvent.count({
      where: { createdAt: { gte: todayStart } },
    })

    // Signups per day (last 30 days)
    const signupTrend: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const count = await prisma.user.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      })
      signupTrend.push({
        date: dayStart.toISOString().slice(0, 10),
        count,
      })
    }

    // Top practiced clips (by session count)
    const topClips = await prisma.userSession.groupBy({
      by: ['clipId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })
    const clipIds = topClips.map(t => t.clipId)
    const clips = await prisma.clip.findMany({
      where: { id: { in: clipIds } },
      select: { id: true, movieTitle: true, skillCategory: true },
    })
    const clipMap = new Map(clips.map(c => [c.id, c]))
    const topPracticedClips = topClips.map(t => ({
      clipId: t.clipId,
      movieTitle: clipMap.get(t.clipId)?.movieTitle ?? 'Unknown',
      skillCategory: clipMap.get(t.clipId)?.skillCategory ?? '',
      count: t._count.id,
    }))

    // Skill popularity
    const skillCounts = await prisma.userSession.groupBy({
      by: ['clipId'],
      _count: { id: true },
    })
    const allClips = await prisma.clip.findMany({ select: { id: true, skillCategory: true } })
    const clipSkillMap = new Map(allClips.map(c => [c.id, c.skillCategory]))
    const skillPop: Record<string, number> = {}
    for (const sc of skillCounts) {
      const skill = clipSkillMap.get(sc.clipId) ?? 'unknown'
      skillPop[skill] = (skillPop[skill] || 0) + sc._count.id
    }

    // Recent activity (last 20 events)
    const recentActivity = await (prisma as any).activityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    // Users list (for analytics table)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { userSessions: true, arcadeAttempts: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      totalUsers,
      dau,
      wau,
      mau,
      sessionsToday,
      signupTrend,
      topPracticedClips,
      skillPopularity: skillPop,
      recentActivity,
      users,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
