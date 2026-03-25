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

export async function GET() {
  try {
    await requireAdmin()
    const bundles = await (prisma as any).arcadeBundle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { challenges: true } } },
    })
    return NextResponse.json(bundles)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const bundle = await (prisma as any).arcadeBundle.create({
      data: {
        title: body.title,
        description: body.description,
        theme: body.theme,
        difficulty: body.difficulty,
        xpReward: body.xpReward ?? 100,
      },
    })
    return NextResponse.json(bundle, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
