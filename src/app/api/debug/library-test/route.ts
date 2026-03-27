import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clips = await prisma.clip.findMany({
      where: { isActive: true },
      orderBy: [{ skillCategory: 'asc' }, { difficultyScore: 'asc' }],
      select: {
        id: true,
        youtubeVideoId: true,
        movieTitle: true,
        year: true,
        characterName: true,
        sceneDescription: true,
        skillCategory: true,
        difficulty: true,
        startSec: true,
        endSec: true,
        screenplaySource: true,
      },
      take: 3,
    })

    return NextResponse.json({
      success: true,
      count: clips.length,
      sample: clips[0] ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
    }, { status: 500 })
  }
}
