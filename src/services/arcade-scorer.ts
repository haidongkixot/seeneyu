import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ArcadeScoreResult {
  score: number
  breakdown: {
    expression_match: number
    intensity: number
    context_fit: number
  }
  feedback_line: string
}

export async function scoreArcadeAttempt(opts: {
  challengeDescription: string
  challengeType: 'facial' | 'gesture'
  context: string
  referenceImageUrl?: string | null
  userFrameUrl: string
}): Promise<ArcadeScoreResult> {
  const { challengeDescription, challengeType, context, userFrameUrl } = opts

  const typeLabel = challengeType === 'facial' ? 'facial expression' : 'body gesture'

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a body language coach scoring a rapid ${typeLabel} challenge.
The user was asked to mimic: "${challengeDescription}"
Context: "${context}"

Score their attempt 0-100 based on:
1. expression_match (0-100): How well does their ${typeLabel} match the description?
2. intensity (0-100): Is the expression/gesture strong enough or too subtle?
3. context_fit (0-100): Does it feel authentic to the described scene context?

Overall score = weighted average (expression_match * 0.5 + intensity * 0.25 + context_fit * 0.25).

Return ONLY valid JSON:
{"score": <int>, "breakdown": {"expression_match": <int>, "intensity": <int>, "context_fit": <int>}, "feedback_line": "<one sentence coaching tip>"}`,
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Score this ${typeLabel} attempt for the challenge: "${challengeDescription}"` },
        { type: 'image_url', image_url: { url: userFrameUrl, detail: 'low' } },
      ],
    },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 300,
    temperature: 0.3,
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      score: 50,
      breakdown: { expression_match: 50, intensity: 50, context_fit: 50 },
      feedback_line: 'Could not parse AI response. Try again!',
    }
  }

  const parsed = JSON.parse(jsonMatch[0]) as ArcadeScoreResult
  // Clamp values
  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)))
  parsed.breakdown.expression_match = Math.max(0, Math.min(100, Math.round(parsed.breakdown.expression_match)))
  parsed.breakdown.intensity = Math.max(0, Math.min(100, Math.round(parsed.breakdown.intensity)))
  parsed.breakdown.context_fit = Math.max(0, Math.min(100, Math.round(parsed.breakdown.context_fit)))

  return parsed
}
