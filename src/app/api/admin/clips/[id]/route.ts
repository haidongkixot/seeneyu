import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const clip = await prisma.clip.findUnique({ where: { id: params.id } })
    if (!clip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(clip)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    // Only pass known Clip fields to Prisma
    const data: any = {}
    const ALLOWED = [
      'youtubeVideoId', 'movieTitle', 'characterName', 'actorName', 'year',
      'sceneDescription', 'skillCategory', 'difficulty', 'difficultyScore',
      'signalClarity', 'noiseLevel', 'contextDependency', 'replicationDifficulty',
      'annotation', 'contextNote', 'script', 'screenplaySource', 'screenplayText',
      'startSec', 'endSec', 'mediaType', 'mediaUrl', 'isActive',
    ]
    for (const key of ALLOWED) {
      if (key in body) data[key] = body[key]
    }
    const clip = await prisma.clip.update({ where: { id: params.id }, data })
    return NextResponse.json(clip)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await prisma.clip.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
