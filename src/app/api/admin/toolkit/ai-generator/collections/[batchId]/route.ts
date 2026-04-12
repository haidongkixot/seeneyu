import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    await requireAdmin()
    const { batchId } = await params

    const requests = await (prisma as any).aiContentRequest.findMany({
      where: { collectionId: batchId },
      include: { assets: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })

    if (requests.length === 0) {
      return NextResponse.json({ error: 'No requests found for this collection' }, { status: 404 })
    }

    const batch = await (prisma as any).practiceIdeaBatch.findUnique({
      where: { id: batchId },
      select: { name: true },
    })

    // Compute progress across ALL assets (not just requests)
    let totalAssets = 0
    let readyAssets = 0
    let generatingAssets = 0
    let failedAssets = 0

    const requestProgress = { draft: 0, generating: 0, review: 0, published: 0, failed: 0 }

    const mappedRequests = requests.map((r: any) => {
      const status = r.status as keyof typeof requestProgress
      if (status in requestProgress) requestProgress[status]++

      const assets = (r.assets || []) as any[]
      const mainAsset = assets.find((a: any) => a.metadata?.role === 'main')
      const stepAssets = assets
        .filter((a: any) => a.metadata?.role === 'step')
        .sort((a: any, b: any) => (a.metadata?.stepNumber || 0) - (b.metadata?.stepNumber || 0))

      for (const a of assets) {
        totalAssets++
        if (a.status === 'ready') readyAssets++
        else if (a.status === 'failed') failedAssets++
        else generatingAssets++
      }

      return {
        id: r.id,
        collectionTitle: r.collectionTitle || '(untitled)',
        sourcePracticeIdeaId: r.sourcePracticeIdeaId,
        status: r.status,
        mainVideo: mainAsset ? {
          id: mainAsset.id,
          status: mainAsset.status,
          blobUrl: mainAsset.blobUrl || null,
          error: mainAsset.errorMessage || null,
          durationSec: mainAsset.metadata?.durationSec || 15,
        } : null,
        steps: stepAssets.map((a: any) => ({
          id: a.id,
          stepNumber: a.metadata?.stepNumber || 0,
          skillFocus: a.metadata?.skillFocus || '',
          status: a.status,
          blobUrl: a.blobUrl || null,
          error: a.errorMessage || null,
          durationSec: a.metadata?.durationSec || 5,
        })),
        totalAssets: assets.length,
        readyAssets: assets.filter((a: any) => a.status === 'ready').length,
      }
    })

    return NextResponse.json({
      batchId,
      batchName: batch?.name || null,
      totalRequests: requests.length,
      totalAssets,
      assetProgress: { ready: readyAssets, generating: generatingAssets, failed: failedAssets },
      requestProgress,
      requests: mappedRequests,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
