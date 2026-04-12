import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/** GET — list all batches (summary only, not full ideas). */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const batches = await (prisma as any).practiceIdeaBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        status: true,
        count: true,
        error: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        config: true,
      },
    })

    return NextResponse.json({ batches })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
