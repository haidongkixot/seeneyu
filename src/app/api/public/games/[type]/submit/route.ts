import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoreRound } from '@/toolkit/mini-games'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// POST /api/public/games/[type]/submit — Submit a round answer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await params // validate route param exists
    const body = await req.json()
    const { sessionId, roundId, answer, timeMs } = body

    if (!sessionId || !roundId || answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, roundId, answer' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify session exists
    const session = await (prisma as any).miniGameSession.findUnique({
      where: { id: sessionId },
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404, headers: corsHeaders })
    }
    if (session.completedAt) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400, headers: corsHeaders })
    }

    // Score the round
    const { correct, correctAnswer } = await scoreRound(roundId, answer)

    // Append response to session
    const currentResponses = (session.responses ?? []) as any[]
    const newResponse = { roundId, answer, correct, timeMs: timeMs ?? 0 }
    currentResponses.push(newResponse)

    const correctCount = currentResponses.filter((r: any) => r.correct).length
    const newScore = Math.round((correctCount / Math.max(currentResponses.length, 1)) * 100)

    await (prisma as any).miniGameSession.update({
      where: { id: sessionId },
      data: {
        responses: currentResponses,
        score: newScore,
      },
    })

    return NextResponse.json({
      correct,
      correctAnswer,
      currentScore: newScore,
      roundsCompleted: currentResponses.length,
    }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error submitting round:', err)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500, headers: corsHeaders })
  }
}
