import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { completeSession } from '@/toolkit/mini-games'
import type { RoundResult } from '@/toolkit/mini-games'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// POST /api/public/games/[type]/complete — Complete session, return final score
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await params
    const body = await req.json()
    const { sessionId, playerName } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch session with current responses
    const session = await (prisma as any).miniGameSession.findUnique({
      where: { id: sessionId },
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404, headers: corsHeaders })
    }
    if (session.completedAt) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400, headers: corsHeaders })
    }

    const responses = (session.responses ?? []) as RoundResult[]

    const result = await completeSession(sessionId, responses, playerName)

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (err) {
    console.error('Error completing session:', err)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500, headers: corsHeaders })
  }
}
