import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** GET — list all collections (distinct collectionId groups). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all distinct collectionIds with their request counts and statuses
    const requests = await (prisma as any).aiContentRequest.findMany({
      where: { collectionId: { not: null } },
      select: {
        collectionId: true,
        collectionTitle: true,
        status: true,
        provider: true,
        createdAt: true,
        assets: { select: { status: true, metadata: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by collectionId
    const collectionsMap = new Map<string, {
      batchId: string
      titles: string[]
      requestCount: number
      totalAssets: number
      readyAssets: number
      generatingAssets: number
      failedAssets: number
      provider: string
      statuses: Record<string, number>
      createdAt: string
    }>()

    for (const r of requests) {
      const cid = r.collectionId as string
      if (!collectionsMap.has(cid)) {
        collectionsMap.set(cid, {
          batchId: cid,
          titles: [],
          requestCount: 0,
          totalAssets: 0,
          readyAssets: 0,
          generatingAssets: 0,
          failedAssets: 0,
          provider: r.provider || '',
          statuses: {},
          createdAt: r.createdAt?.toISOString?.() || String(r.createdAt),
        })
      }
      const c = collectionsMap.get(cid)!
      c.requestCount++
      if (r.collectionTitle) c.titles.push(r.collectionTitle)
      c.statuses[r.status] = (c.statuses[r.status] || 0) + 1
      for (const a of (r.assets || [])) {
        c.totalAssets++
        if (a.status === 'ready') c.readyAssets++
        else if (a.status === 'failed') c.failedAssets++
        else c.generatingAssets++
      }
    }

    // Load batch names from PracticeIdeaBatch
    const batchIds = Array.from(collectionsMap.keys())
    const batches = await (prisma as any).practiceIdeaBatch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, name: true },
    })
    const batchNameMap = new Map(batches.map((b: any) => [b.id, b.name]))

    const collections = Array.from(collectionsMap.values()).map(c => ({
      ...c,
      batchName: batchNameMap.get(c.batchId) || c.titles[0] || 'Unknown',
      overallStatus: c.generatingAssets > 0 ? 'generating'
        : c.failedAssets === c.totalAssets ? 'failed'
        : c.readyAssets > 0 ? 'review'
        : 'draft',
    }))

    // Sort by createdAt desc
    collections.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ collections })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
