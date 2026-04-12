import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    await requireAdmin()
    const { batchId } = await params

    // Load all requests in this collection with their assets
    const requests = await (prisma as any).aiContentRequest.findMany({
      where: { collectionId: batchId },
      include: { assets: true },
      orderBy: { createdAt: 'asc' },
    })

    if (requests.length === 0) {
      return NextResponse.json(
        { error: 'No requests found for this collection' },
        { status: 404 },
      )
    }

    // Load the source batch name for display
    const batch = await (prisma as any).practiceIdeaBatch.findUnique({
      where: { id: batchId },
      select: { name: true },
    })

    // Compute progress by status
    const progress = { draft: 0, generating: 0, review: 0, published: 0, failed: 0 }
    for (const r of requests) {
      const status = r.status as keyof typeof progress
      if (status in progress) {
        progress[status]++
      }
    }

    // Map requests to a slim response shape
    const mappedRequests = requests.map((r: any) => {
      const readyAsset = r.assets?.find((a: any) => a.status === 'ready')
      const failedAsset = r.assets?.find((a: any) => a.status === 'failed')

      return {
        id: r.id,
        collectionTitle: r.collectionTitle,
        sourcePracticeIdeaId: r.sourcePracticeIdeaId,
        status: r.status,
        provider: r.provider,
        model: r.model,
        assetUrl: readyAsset?.blobUrl || null,
        error: failedAsset?.errorMessage || null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
    })

    return NextResponse.json({
      batchId,
      batchName: batch?.name || null,
      totalRequests: requests.length,
      progress,
      requests: mappedRequests,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Collection status fetch failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
