import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import OpenAI from 'openai'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ObservationGuide } from '@/lib/types'

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

function buildObservationPrompt(clip: {
  characterName: string | null
  actorName: string | null
  movieTitle: string
  sceneDescription: string
  annotation: string
  script?: string | null
  skillCategory: string
  startSec: number
  endSec: number
}): string {
  const character = clip.characterName
    ? `${clip.characterName}${clip.actorName ? ` (${clip.actorName})` : ''} from ${clip.movieTitle}`
    : `a character from ${clip.movieTitle}`
  const duration = clip.endSec - clip.startSec
  const scriptLine = clip.script ? `\nScript/dialogue: "${clip.script}"` : ''

  return `You are a body language and communication coach writing an observation guide for a learning app.

Character: ${character}
Scene: ${clip.sceneDescription}
Skill focus: ${clip.skillCategory.replace('-', ' ')}
Clip duration: ${duration} seconds (starts at ${clip.startSec}s)
Coaching note: ${clip.annotation}${scriptLine}

Generate an observation guide that teaches learners exactly what to watch for in this clip.
Create 4-6 specific technique moments, each tied to an approximate timestamp within the clip.

Return a JSON object with EXACTLY this structure:
{
  "headline": "What [character first name] does — and why it works",
  "moments": [
    {
      "atSecond": <integer, seconds from start of full video>,
      "technique": "<short technique name, 2-4 words, e.g. 'Direct Eye Contact'>",
      "what": "<one sentence: the specific visible behaviour>",
      "why": "<one sentence: why this technique works psychologically or socially>"
    }
  ]
}

Moments must be ordered by atSecond ascending. Be specific and educational. Avoid vague language.`
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const clip = await prisma.clip.findUnique({ where: { id: params.id } })
    if (!clip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const prompt = buildObservationPrompt({
      ...clip,
      script: (clip as any).script ?? null,
    })

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in GPT response')

    const guide = JSON.parse(jsonMatch[0]) as ObservationGuide

    await prisma.clip.update({
      where: { id: params.id },
      data: { observationGuide: JSON.parse(JSON.stringify(guide)) },
    })

    return NextResponse.json({ observationGuide: guide })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Observation guide generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
