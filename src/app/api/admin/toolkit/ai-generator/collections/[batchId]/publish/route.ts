import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { convertToClip } from '@/toolkit/ai-content-generator/services/content-converter'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    await requireAdmin()
    const { batchId } = await params

    // Find all requests in this collection that are ready for publishing
    const reviewRequests = await (prisma as any).aiContentRequest.findMany({
      where: {
        collectionId: batchId,
        status: 'review',
      },
      select: { id: true },
    })

    if (reviewRequests.length === 0) {
      return NextResponse.json(
        { error: 'No requests in "review" status to publish' },
        { status: 400 },
      )
    }

    let published = 0
    let failed = 0
    const errors: string[] = []

    for (const request of reviewRequests) {
      try {
        await convertToClip(request.id)
        // convertToClip updates the request status to 'published' internally
        // but let's ensure it's set in case the converter doesn't
        await (prisma as any).aiContentRequest.update({
          where: { id: request.id },
          data: { status: 'published' },
        }).catch(() => {})
        published++
      } catch (err) {
        failed++
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`${request.id}: ${message}`)
        console.error(`Publish failed for request ${request.id}:`, err)

        // Mark as failed so admin can see which ones didn't work
        await (prisma as any).aiContentRequest.update({
          where: { id: request.id },
          data: { status: 'failed' },
        }).catch(() => {})
      }
    }

    return NextResponse.json({
      published,
      failed,
      errors,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Collection publish failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
