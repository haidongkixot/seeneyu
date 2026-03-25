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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const challenge = await (prisma as any).arcadeChallenge.findUnique({ where: { id } })
    if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(challenge)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const challenge = await (prisma as any).arcadeChallenge.update({
      where: { id },
      data: {
        type: body.type,
        title: body.title,
        description: body.description,
        context: body.context,
        referenceImageUrl: body.referenceImageUrl,
        sourceClipId: body.sourceClipId || null,
        sourceTimestamp: body.sourceTimestamp ?? null,
        difficulty: body.difficulty,
        xpReward: body.xpReward,
        orderIndex: body.orderIndex,
      },
    })
    return NextResponse.json(challenge)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    await (prisma as any).arcadeChallenge.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
