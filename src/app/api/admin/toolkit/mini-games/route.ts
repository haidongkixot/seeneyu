import { NextRequest, NextResponse } from 'next/server'
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

const VALID_TYPES = ['guess_expression', 'match_expression', 'expression_king']

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const games = await prisma.miniGame.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            rounds: true,
            sessions: true,
          },
        },
      },
    })

    // Compute stats for each game
    const gamesWithStats = await Promise.all(
      games.map(async (game) => {
        const [avgScore, activePlayers] = await Promise.all([
          prisma.miniGameSession.aggregate({
            where: { gameId: game.id, completedAt: { not: null } },
            _avg: { score: true },
          }),
          prisma.miniGameSession.groupBy({
            by: ['playerId'],
            where: { gameId: game.id, playerId: { not: null } },
          }),
        ])

        return {
          ...game,
          stats: {
            totalSessions: game._count.sessions,
            totalRounds: game._count.rounds,
            avgScore: avgScore._avg.score ?? 0,
            activePlayers: activePlayers.length,
          },
        }
      })
    )

    return NextResponse.json(gamesWithStats)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { type, title, description, config } = body

    if (!type || !title || !description) {
      return NextResponse.json({ error: 'type, title, and description are required' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    const game = await prisma.miniGame.create({
      data: {
        type,
        title,
        description,
        config: config ?? {},
      },
    })

    return NextResponse.json(game, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
