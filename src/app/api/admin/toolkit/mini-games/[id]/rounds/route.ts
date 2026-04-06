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
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where = { gameId: params.id }

    const [items, total] = await Promise.all([
      prisma.miniGameRound.findMany({
        where,
        orderBy: { orderIndex: 'asc' },
        skip,
        take: limit,
      }),
      prisma.miniGameRound.count({ where }),
    ])

    return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { prompt, imageUrl, correctAnswer, options } = body

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    // Verify game exists
    const game = await prisma.miniGame.findUnique({ where: { id: params.id } })
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Get next orderIndex
    const lastRound = await prisma.miniGameRound.findFirst({
      where: { gameId: params.id },
      orderBy: { orderIndex: 'desc' },
    })
    const nextOrder = (lastRound?.orderIndex ?? -1) + 1

    const round = await prisma.miniGameRound.create({
      data: {
        gameId: params.id,
        orderIndex: nextOrder,
        prompt,
        imageUrl: imageUrl ?? null,
        correctAnswer: correctAnswer ?? null,
        options: options ?? null,
      },
    })

    return NextResponse.json(round, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
