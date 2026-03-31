import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await params

  const team = await (prisma as any).teamPlan.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, name: true, email: true } },
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          gamification: { select: { totalXp: true, level: true, currentStreak: true } },
          foundationProgress: { select: { completedAt: true }, where: { completedAt: { not: null } } },
        },
      },
    },
  })

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Only admin can view
  if (team.adminId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ team })
}
