import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllowedGames } from '@/lib/access-control'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/public/games — List active mini-games
// For embedded/public use: returns all games (viral acquisition).
// For in-app authenticated use: pass ?auth=1 to get plan-filtered list.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inApp = searchParams.get('auth') === '1'

    let allowedTypes: string[] | null = null
    if (inApp) {
      const session = await getServerSession(authOptions)
      const userId = (session?.user as any)?.id as string | undefined
      let userPlan = 'basic'
      if (userId) {
        const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
        if (dbUser?.plan) userPlan = dbUser.plan
      }
      allowedTypes = getAllowedGames(userPlan)
    }

    const games = await (prisma as any).miniGame.findMany({
      where: {
        isActive: true,
        ...(allowedTypes ? { type: { in: allowedTypes } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { rounds: true, sessions: true } } },
    })

    const result = games.map((g: any) => ({
      id: g.id,
      type: g.type,
      title: g.title,
      description: g.description,
      config: g.config,
      roundCount: g._count.rounds,
      totalPlays: g._count.sessions,
      isLocked: allowedTypes ? !allowedTypes.includes(g.type) : false,
    }))

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (err) {
    console.error('Error fetching games:', err)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500, headers: corsHeaders })
  }
}
