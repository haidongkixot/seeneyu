import { NextRequest, NextResponse } from 'next/server'
import { getGameConfig, getRandomRounds, createSession } from '@/toolkit/mini-games'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/public/games/[type] — Get game config + random rounds
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const game = await getGameConfig(type)

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404, headers: corsHeaders })
    }

    if (!game.isActive) {
      return NextResponse.json({ error: 'Game is not active' }, { status: 404, headers: corsHeaders })
    }

    const rounds = await getRandomRounds(game.id, game.config.totalRounds)

    // Create a session for this play
    const session = await createSession(game.id)

    return NextResponse.json({
      game: {
        id: game.id,
        type: game.type,
        title: game.title,
        description: game.description,
        config: game.config,
      },
      sessionId: session.id,
      rounds,
    }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error fetching game:', err)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500, headers: corsHeaders })
  }
}
