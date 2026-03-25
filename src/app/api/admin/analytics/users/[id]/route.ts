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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        onboardingComplete: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Activity timeline
    const events = await (prisma as any).activityEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Sessions with scores
    const sessions = await prisma.userSession.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { clip: { select: { movieTitle: true, skillCategory: true } } },
    })

    // Arcade attempts
    const arcadeAttempts = await (prisma as any).arcadeAttempt.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { challenge: { select: { title: true, type: true } } },
    })

    // Learning curve — scores over time
    const scoreHistory = sessions
      .filter((s: any) => s.scores)
      .map((s: any) => ({
        date: s.createdAt,
        score: (s.scores as any)?.overallScore ?? 0,
        skill: s.clip?.skillCategory,
      }))
      .reverse()

    return NextResponse.json({
      user,
      events,
      sessions,
      arcadeAttempts,
      scoreHistory,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
