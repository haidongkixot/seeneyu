import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** GET — compact stats for the toolkit dashboard card. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [total, complete, generating, failed, totalIdeasAgg] = await Promise.all([
      (prisma as any).practiceIdeaBatch.count(),
      (prisma as any).practiceIdeaBatch.count({ where: { status: 'complete' } }),
      (prisma as any).practiceIdeaBatch.count({ where: { status: 'generating' } }),
      (prisma as any).practiceIdeaBatch.count({ where: { status: 'failed' } }),
      (prisma as any).practiceIdeaBatch.aggregate({
        _sum: { count: true },
        where: { status: 'complete' },
      }),
    ])

    return NextResponse.json({
      totalBatches: total,
      completeBatches: complete,
      generating,
      failed,
      totalIdeas: totalIdeasAgg._sum.count ?? 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
