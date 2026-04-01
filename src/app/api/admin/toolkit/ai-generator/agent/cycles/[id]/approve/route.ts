import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { processApprovedSuggestions } from '@/engine/content-agent'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { suggestionIds } = body as { suggestionIds?: string[] }

  const cycle = await prisma.contentAgentCycle.findUnique({ where: { id } })
  if (!cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
  }
  if (cycle.status !== 'suggestions_ready') {
    return NextResponse.json(
      { error: `Cycle status is ${cycle.status}, expected suggestions_ready` },
      { status: 400 },
    )
  }

  // If specific IDs provided, approve those; otherwise approve all pending
  if (suggestionIds && suggestionIds.length > 0) {
    await prisma.contentSuggestion.updateMany({
      where: { id: { in: suggestionIds }, cycleId: id, status: 'pending' },
      data: { status: 'approved' },
    })
  } else {
    await prisma.contentSuggestion.updateMany({
      where: { cycleId: id, status: 'pending' },
      data: { status: 'approved' },
    })
  }

  // Mark cycle as approved
  const adminId = (session.user as any).id as string
  await prisma.contentAgentCycle.update({
    where: { id },
    data: { status: 'approved', approvedBy: adminId, approvedAt: new Date() },
  })

  // Trigger generation (non-blocking)
  processApprovedSuggestions(id).catch(err =>
    console.error('Generation orchestration error:', err),
  )

  return NextResponse.json({ ok: true, message: 'Approved. Generation starting.' })
}
