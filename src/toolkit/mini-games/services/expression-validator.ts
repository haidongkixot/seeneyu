import { prisma } from '@/lib/prisma'
import type { CertificateData } from '../types'

// ── Expression Validation via OpenAI Vision ─────────────────────────────────

export async function validateExpression(
  imageBase64: string,
  targetLabel: string
): Promise<{ score: number; analysis: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Fallback: return a random-ish score when no API key
    const fallbackScore = Math.floor(Math.random() * 40) + 40
    return {
      score: fallbackScore,
      analysis: `Expression validation unavailable (no API key). Estimated score: ${fallbackScore}/100 for "${targetLabel}".`,
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `You are an expert in facial expression analysis for a body language coaching app.
Score how well the person's facial expression matches the target emotion/expression.
Respond ONLY with valid JSON: { "score": <0-100>, "analysis": "<1-2 sentence feedback>" }
Be encouraging but honest. Score 80+ for clearly matching expressions, 50-79 for partial matches, below 50 for mismatches.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Target expression: "${targetLabel}". Score how well this person demonstrates it.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        analysis: parsed.analysis || 'Expression analyzed.',
      }
    }

    return { score: 50, analysis: 'Could not parse AI response.' }
  } catch (err) {
    console.error('Expression validation error:', err)
    return {
      score: 45,
      analysis: 'Expression analysis temporarily unavailable. Please try again.',
    }
  }
}

// ── Certificate Generation ──────────────────────────────────────────────────

export async function generateCertificate(sessionId: string): Promise<CertificateData | null> {
  const session = await (prisma as any).miniGameSession.findUnique({
    where: { id: sessionId },
    include: { game: true },
  })

  if (!session || !session.completedAt) return null
  if (session.game.type !== 'expression_king') return null

  const responses = (session.responses ?? []) as Array<{
    roundId: string
    answer: string
    correct: boolean
    timeMs: number
    score?: number
  }>

  // Count challenges passed (score >= 60)
  const passedResponses = responses.filter(r => (r.score ?? 0) >= 60)

  // Need 5+ passed challenges for a certificate
  if (passedResponses.length < 5) return null

  // Get challenge labels from rounds
  const roundIds = passedResponses.map(r => r.roundId)
  const rounds = await (prisma as any).miniGameRound.findMany({
    where: { id: { in: roundIds } },
  })
  const challengesPassed = rounds.map((r: any) => r.prompt)

  return {
    sessionId,
    playerName: session.playerName || 'Anonymous Player',
    gameTitle: session.game.title,
    score: session.score,
    totalRounds: session.totalRounds,
    correctCount: passedResponses.length,
    completedAt: session.completedAt.toISOString(),
    challengesPassed,
  }
}
