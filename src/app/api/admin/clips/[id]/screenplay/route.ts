import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { crawlScreenplay } from '@/services/screenplay-crawler'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

/** GET — return stored screenplay text */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const clip = await prisma.clip.findUnique({
      where: { id },
      select: { screenplayText: true, screenplaySource: true },
    })
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    return NextResponse.json({
      screenplayText: clip.screenplayText,
      screenplaySource: clip.screenplaySource,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** POST — crawl screenplay from source URL, extract text, save to DB */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const clip = await prisma.clip.findUnique({ where: { id } })
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    if (!clip.screenplaySource) {
      return NextResponse.json({ error: 'Clip has no screenplaySource URL' }, { status: 400 })
    }

    const result = await crawlScreenplay(clip.screenplaySource)

    await prisma.clip.update({
      where: { id },
      data: { screenplayText: result.text },
    })

    return NextResponse.json({
      success: true,
      charCount: result.charCount,
      source: result.source,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
