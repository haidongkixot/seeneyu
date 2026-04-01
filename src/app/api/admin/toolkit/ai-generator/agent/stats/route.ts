import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [totalCycles, pendingReview, generating, completed, latest] = await Promise.all([
    prisma.contentAgentCycle.count(),
    prisma.contentAgentCycle.count({ where: { status: 'suggestions_ready' } }),
    prisma.contentAgentCycle.count({ where: { status: 'generating' } }),
    prisma.contentAgentCycle.count({ where: { status: 'completed' } }),
    prisma.contentAgentCycle.findFirst({ orderBy: { createdAt: 'desc' }, select: { status: true } }),
  ])

  return NextResponse.json({
    totalCycles,
    pendingReview,
    generating,
    completed,
    latestStatus: latest?.status ?? null,
  })
}
