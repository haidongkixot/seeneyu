import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllowedDifficulties } from '@/lib/access-control'

export async function GET(
  req: NextRequest,
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

    // Enforce difficulty-based paywall
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    let userPlan = 'basic'
    if (userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
      if (dbUser?.plan) userPlan = dbUser.plan
    }
    const allowed = getAllowedDifficulties(userPlan)
    if (!allowed.includes(clip.difficulty.toLowerCase())) {
      return NextResponse.json(
        { error: 'Upgrade your plan to access this clip', upgradeRequired: true },
        { status: 403 }
      )
    }

    return NextResponse.json(clip)
  } catch (error) {
    console.error('GET /api/clips/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch clip' }, { status: 500 })
  }
}
