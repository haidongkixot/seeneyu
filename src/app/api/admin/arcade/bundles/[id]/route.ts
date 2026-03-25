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
    const bundle = await (prisma as any).arcadeBundle.findUnique({
      where: { id },
      include: {
        challenges: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { challenges: true } },
      },
    })
    if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(bundle)
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
    const bundle = await (prisma as any).arcadeBundle.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        theme: body.theme,
        difficulty: body.difficulty,
        xpReward: body.xpReward,
      },
    })
    return NextResponse.json(bundle)
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
    await (prisma as any).arcadeBundle.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
