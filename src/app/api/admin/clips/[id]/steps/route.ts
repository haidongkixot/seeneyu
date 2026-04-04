import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/** GET — fetch all practice steps for a clip, ordered by stepNumber */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const steps = await prisma.practiceStep.findMany({
      where: { clipId: id },
      orderBy: { stepNumber: 'asc' },
    })
    return NextResponse.json(steps)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

/** PUT — bulk upsert practice steps (create/update/delete in transaction) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const steps = body.steps as Array<{
      id?: string
      stepNumber: number
      skillFocus: string
      instruction: string
      tip?: string | null
      targetDurationSec?: number
      demoImageUrl?: string | null
      subSteps?: any[] | null
      voiceUrl?: string | null
    }>

    if (!Array.isArray(steps)) {
      return NextResponse.json({ error: 'steps array required' }, { status: 400 })
    }

    // Verify clip exists
    const clip = await prisma.clip.findUnique({ where: { id } })
    if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      // Get existing step IDs
      const existing = await tx.practiceStep.findMany({
        where: { clipId: id },
        select: { id: true },
      })
      const existingIds = new Set(existing.map((s) => s.id))
      const incomingIds = new Set(steps.filter((s) => s.id).map((s) => s.id!))

      // Delete removed steps
      const toDelete = Array.from(existingIds).filter((eid) => !incomingIds.has(eid))
      if (toDelete.length > 0) {
        await tx.practiceStep.deleteMany({ where: { id: { in: toDelete } } })
      }

      // Upsert each step
      for (const step of steps) {
        const data: any = {
          clipId: id,
          stepNumber: step.stepNumber,
          skillFocus: step.skillFocus,
          instruction: step.instruction,
          tip: step.tip ?? null,
          targetDurationSec: step.targetDurationSec ?? 20,
          demoImageUrl: step.demoImageUrl ?? null,
          subSteps: step.subSteps ?? undefined,
          voiceUrl: step.voiceUrl ?? null,
        }

        if (step.id && existingIds.has(step.id)) {
          await tx.practiceStep.update({ where: { id: step.id }, data })
        } else {
          await tx.practiceStep.create({ data })
        }
      }
    })

    const updated = await prisma.practiceStep.findMany({
      where: { clipId: id },
      orderBy: { stepNumber: 'asc' },
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
