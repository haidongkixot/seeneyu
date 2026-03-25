import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateExpression } from '@/toolkit/mini-games'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// POST /api/public/games/[type]/capture — Expression King: upload photo for AI validation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params

    if (type !== 'expression_king') {
      return NextResponse.json(
        { error: 'Capture endpoint is only available for expression_king game' },
        { status: 400, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { sessionId, challengeLabel, image } = body

    if (!challengeLabel || !image) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeLabel, image' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate expression using OpenAI Vision
    const { score, analysis } = await validateExpression(image, challengeLabel)

    // Store submission
    const submission = await (prisma as any).expressionSubmission.create({
      data: {
        sessionId: sessionId || null,
        challengeLabel,
        imageUrl: image.substring(0, 100) + '...', // Don't store full base64, just reference
        aiScore: score,
        aiAnalysis: analysis,
        status: 'pending',
      },
    })

    // If session exists, append to session responses
    if (sessionId) {
      const session = await (prisma as any).miniGameSession.findUnique({
        where: { id: sessionId },
      })
      if (session && !session.completedAt) {
        const currentResponses = (session.responses ?? []) as any[]
        currentResponses.push({
          roundId: submission.id,
          answer: challengeLabel,
          correct: score >= 60,
          timeMs: 0,
          score,
          analysis,
        })

        // Calculate new score: average of all AI scores
        const aiScores = currentResponses.filter((r: any) => r.score !== undefined).map((r: any) => r.score)
        const avgScore = aiScores.length > 0
          ? Math.round(aiScores.reduce((a: number, b: number) => a + b, 0) / aiScores.length)
          : 0

        await (prisma as any).miniGameSession.update({
          where: { id: sessionId },
          data: {
            responses: currentResponses,
            score: avgScore,
          },
        })
      }
    }

    return NextResponse.json({
      submissionId: submission.id,
      score,
      analysis,
      passed: score >= 60,
    }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error processing capture:', err)
    return NextResponse.json({ error: 'Failed to process expression capture' }, { status: 500, headers: corsHeaders })
  }
}
