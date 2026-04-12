import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pushBatchToGenerator } from '@/services/ai-content-generator/batch-pusher'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()

    const body = await req.json()
    const {
      batchId,
      provider,
      model = null,
      options = {},
      concurrency = 3,
    } = body

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
    }
    if (!provider) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 })
    }

    // Validate batch exists and is complete
    const batch = await (prisma as any).practiceIdeaBatch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }
    if (batch.status !== 'complete') {
      return NextResponse.json(
        { error: `Batch status is "${batch.status}", must be "complete"` },
        { status: 400 },
      )
    }

    const ideas = batch.ideas as any[]
    if (!ideas || ideas.length === 0) {
      return NextResponse.json({ error: 'Batch has no ideas' }, { status: 400 })
    }

    // Check if batch was already pushed (avoid duplicates)
    const existingCount = await (prisma as any).aiContentRequest.count({
      where: { collectionId: batchId },
    })
    if (existingCount > 0) {
      return NextResponse.json(
        { error: `Batch already pushed (${existingCount} requests exist). Delete them first to re-push.` },
        { status: 409 },
      )
    }

    const result = await pushBatchToGenerator({
      batchId,
      provider,
      model,
      options: {
        duration: options.duration,
        aspectRatio: options.aspectRatio,
        resolution: options.resolution,
      },
      concurrency: Math.min(Math.max(concurrency, 1), 5),
      createdBy: (session.user as any).id || (session.user as any).email || 'admin',
    })

    return NextResponse.json({
      collectionId: batchId,
      requestIds: result.requestIds,
      count: result.count,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Push from ideating failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
