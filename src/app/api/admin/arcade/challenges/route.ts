import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const bundleId = searchParams.get('bundleId')
    const where = bundleId ? { bundleId } : {}
    const challenges = await (prisma as any).arcadeChallenge.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    })
    return NextResponse.json(challenges)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const challenge = await (prisma as any).arcadeChallenge.create({
      data: {
        bundleId: body.bundleId,
        type: body.type,
        title: body.title,
        description: body.description,
        context: body.context,
        referenceImageUrl: body.referenceImageUrl || null,
        sourceClipId: body.sourceClipId || null,
        sourceTimestamp: body.sourceTimestamp ?? null,
        difficulty: body.difficulty,
        xpReward: body.xpReward ?? 20,
        orderIndex: body.orderIndex ?? 0,
      },
    })
    return NextResponse.json(challenge, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
