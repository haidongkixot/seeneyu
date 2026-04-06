import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const skill = url.searchParams.get('skill') || undefined
    const difficulty = url.searchParams.get('difficulty') || undefined
    const search = url.searchParams.get('search') || undefined

    const where: any = { isActive: true }
    if (skill) where.skillCategory = skill
    if (difficulty) where.difficulty = difficulty
    if (search) {
      where.OR = [
        { movieTitle: { contains: search, mode: 'insensitive' } },
        { sceneDescription: { contains: search, mode: 'insensitive' } },
        { characterName: { contains: search, mode: 'insensitive' } },
        { skillCategory: { contains: search, mode: 'insensitive' } },
      ]
    }

    const clips = await prisma.clip.findMany({
      where,
      orderBy: [{ skillCategory: 'asc' }, { difficultyScore: 'asc' }],
      select: {
        id: true,
        youtubeVideoId: true,
        movieTitle: true,
        year: true,
        characterName: true,
        actorName: true,
        sceneDescription: true,
        skillCategory: true,
        difficulty: true,
        annotation: true,
        startSec: true,
        endSec: true,
      },
    })

    return NextResponse.json({ clips })
  } catch (error) {
    console.error('GET /api/clips error:', error)
    return NextResponse.json({ error: 'Failed to fetch clips' }, { status: 500 })
  }
}
