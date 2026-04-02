import OpenAI from 'openai'
import type { YouTubeSearchResult } from './youtube-crawler'

// Lazy init — avoid module-level instantiation which can fail on cold start
// when process.env isn't fully populated yet.
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  return new OpenAI({ apiKey })
}

export interface JobCriteria {
  skillCategory: string
  technique: string | null
  difficulty: string | null
}

export interface RelevanceScore {
  score: number     // 0-10
  analysis: string  // 1-2 sentence reason
}

async function callScorer(prompt: string): Promise<RelevanceScore> {
  const openai = getOpenAI()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 200,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content)
  const score = Math.max(0, Math.min(10, Number(parsed.score) || 0))
  const analysis = String(parsed.analysis || 'No analysis returned')

  // Guard against model returning failure text instead of a real analysis
  if (!parsed.score && !parsed.analysis) {
    throw new Error('OpenAI returned empty or unexpected JSON')
  }

  return { score, analysis }
}

export async function scoreClipRelevance(
  result: YouTubeSearchResult,
  criteria: JobCriteria,
): Promise<RelevanceScore> {
  if (!process.env.OPENAI_API_KEY) {
    return { score: 0, analysis: 'OPENAI_API_KEY is not configured — scoring skipped.' }
  }

  const techniqueStr = criteria.technique ? `Specific technique: ${criteria.technique}.` : ''
  const difficultyStr = criteria.difficulty && criteria.difficulty !== 'all'
    ? `Target difficulty: ${criteria.difficulty}.`
    : ''
  const description = result.description?.trim().slice(0, 400) || '(no description available)'

  const prompt = `You are evaluating YouTube videos for use as body language and communication skill training clips.

Criteria:
- Skill category: ${criteria.skillCategory}
${techniqueStr}
${difficultyStr}

Video to evaluate:
- Title: ${result.title}
- Channel: ${result.channelName}
- Description: ${description}

Rate this video 0-10 for usefulness as a communication skill training clip where learners watch a specific scene and practice mimicking the technique. High scores (7-10): clearly identifiable human communication behavior in movie clip/speech/interview, skill directly observable and mimicable. Low scores (0-3): talking-head tutorial, no visible body language, unrelated content.

Respond with valid JSON only: { "score": <integer 0-10>, "analysis": "<1-2 sentence coaching reason>" }`

  // Try twice — once for transient errors (rate limit, network blip)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await callScorer(prompt)
    } catch (err: any) {
      const isLast = attempt === 2
      console.error(`[scorer] attempt ${attempt} failed for "${result.title}":`, err?.message || err)
      if (isLast) {
        return {
          score: 0,
          analysis: `Scoring error (attempt ${attempt}): ${err?.message || 'Unknown error'}`,
        }
      }
      // Brief backoff before retry
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // Unreachable — TypeScript needs a return here
  return { score: 0, analysis: 'Scoring did not complete.' }
}

export async function scoreClipsBatch(
  results: YouTubeSearchResult[],
  criteria: JobCriteria,
  concurrency = 3,
): Promise<RelevanceScore[]> {
  const scores: RelevanceScore[] = new Array(results.length)
  for (let i = 0; i < results.length; i += concurrency) {
    const batch = results.slice(i, i + concurrency)
    const batchScores = await Promise.all(
      batch.map((r) => scoreClipRelevance(r, criteria))
    )
    for (let j = 0; j < batchScores.length; j++) {
      scores[i + j] = batchScores[j]
    }
  }
  return scores
}
