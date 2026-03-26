import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const clip = await prisma.clip.findUnique({
      where: { id },
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
        script: true,
        observationGuide: true,
        screenplaySource: true,
        screenplayText: true,
      },
    })

    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    return NextResponse.json(clip)
  } catch (error) {
    console.error('GET /api/clips/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch clip' }, { status: 500 })
  }
}
