import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const cycle = await prisma.contentAgentCycle.findUnique({
    where: { id },
    include: {
      suggestions: {
        orderBy: { priority: 'asc' },
        include: { generationJobs: true },
      },
    },
  })

  if (!cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
  }

  // Also fetch the gap snapshot for this cycle
  const snapshot = await prisma.contentGapSnapshot.findFirst({
    where: { cycleId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ cycle, snapshot })
}
