import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/public/games — List active mini-games
export async function GET() {
  try {
    const games = await (prisma as any).miniGame.findMany({
      where: { isActive: true },
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
    }))

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (err) {
    console.error('Error fetching games:', err)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500, headers: corsHeaders })
  }
}
