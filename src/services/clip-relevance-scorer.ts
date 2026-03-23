import OpenAI from 'openai'
import type { YouTubeSearchResult } from './youtube-crawler'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface JobCriteria {
  skillCategory: string
  technique: string | null
  difficulty: string | null
}

export interface RelevanceScore {
  score: number     // 0-10
  analysis: string  // 1-2 sentence reason
}

export async function scoreClipRelevance(
  result: YouTubeSearchResult,
  criteria: JobCriteria
): Promise<RelevanceScore> {
  const techniqueStr = criteria.technique
    ? `Specific technique: ${criteria.technique}.`
    : ''
  const difficultyStr = criteria.difficulty && criteria.difficulty !== 'all'
    ? `Target difficulty: ${criteria.difficulty}.`
    : ''

  const prompt = `You are evaluating YouTube videos for use as body language and communication skill training clips.

Criteria:
- Skill category: ${criteria.skillCategory}
${techniqueStr}
${difficultyStr}

Video to evaluate:
- Title: ${result.title}
- Channel: ${result.channelName}
- Description: ${result.description.slice(0, 400)}

Rate this video 0-10 for usefulness as a communication skill training clip where learners watch a specific scene and practice mimicking the technique. High scores require: clearly identifiable human communication behavior, short extractable scene (movie clip, speech, interview), skill directly observable and mimicable, NOT a talking-head tutorial.

Return ONLY valid JSON: { "score": <number 0-10>, "analysis": "<1-2 sentence reason>" }`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 150,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content)
    return {
      score: Math.max(0, Math.min(10, Number(parsed.score) || 0)),
      analysis: String(parsed.analysis || ''),
    }
  } catch {
    return { score: 0, analysis: 'Scoring failed.' }
  }
}

export async function scoreClipsBatch(
  results: YouTubeSearchResult[],
  criteria: JobCriteria,
  concurrency = 5
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
