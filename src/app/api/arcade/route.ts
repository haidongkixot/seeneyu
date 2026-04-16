import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTrustedCorsHeaders } from '@/lib/cors'

export async function OPTIONS(req: Request) {
  const headers = getTrustedCorsHeaders(req.headers.get('origin'))
  return new NextResponse(null, { status: 204, headers })
}

// GET /api/arcade — List all arcade bundles
export async function GET(req: Request) {
  const corsHeaders = getTrustedCorsHeaders(req.headers.get('origin'))
  try {
    const bundles = await (prisma as any).arcadeBundle.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { challenges: true } },
        challenges: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            difficulty: true,
            xpReward: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    const result = bundles.map((b: any) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      theme: b.theme,
      difficulty: b.difficulty,
      xpReward: b.xpReward,
      challengeCount: b._count.challenges,
      challenges: b.challenges,
    }))

    return NextResponse.json({ bundles: result }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error fetching arcade bundles:', err)
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500, headers: corsHeaders }
    )
  }
}
