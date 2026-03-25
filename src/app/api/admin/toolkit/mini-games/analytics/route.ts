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

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalPlays,
      completedPlays,
      avgScoresByGame,
      dailyPlays,
      topPlayers,
      submissionsByStatus,
    ] = await Promise.all([
      // Total plays
      prisma.miniGameSession.count(),

      // Completed plays
      prisma.miniGameSession.count({
        where: { completedAt: { not: null } },
      }),

      // Average scores per game
      prisma.miniGameSession.groupBy({
        by: ['gameId'],
        where: { completedAt: { not: null } },
        _avg: { score: true },
        _count: { id: true },
      }),

      // Daily plays (last 30 days) — raw query for date grouping
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
        FROM "MiniGameSession"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // Top players by total score across completed sessions
      prisma.miniGameSession.groupBy({
        by: ['playerName'],
        where: { completedAt: { not: null }, playerName: { not: null } },
        _sum: { score: true },
        _count: { id: true },
        orderBy: { _sum: { score: 'desc' } },
        take: 10,
      }),

      // Expression submissions count by status
      prisma.expressionSubmission.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ])

    // Enrich avgScoresByGame with game titles
    const gameIds = avgScoresByGame.map((g) => g.gameId)
    const games = await prisma.miniGame.findMany({
      where: { id: { in: gameIds } },
      select: { id: true, type: true, title: true },
    })
    const gameMap = new Map(games.map((g) => [g.id, g]))

    const completionRate = totalPlays > 0 ? completedPlays / totalPlays : 0

    return NextResponse.json({
      totalPlays,
      completedPlays,
      completionRate,
      avgScoresByGame: avgScoresByGame.map((g) => ({
        gameId: g.gameId,
        game: gameMap.get(g.gameId) ?? null,
        avgScore: g._avg.score ?? 0,
        sessionsCount: g._count.id,
      })),
      dailyPlays: dailyPlays.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      topPlayers: topPlayers.map((p) => ({
        playerName: p.playerName,
        totalScore: p._sum.score ?? 0,
        gamesPlayed: p._count.id,
      })),
      submissionsByStatus: submissionsByStatus.reduce(
        (acc, s) => {
          acc[s.status] = s._count.id
          return acc
        },
        {} as Record<string, number>
      ),
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
