import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchYouTubeTranscript, fetchVideoDescription } from '@/services/youtube-transcript'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

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

    const videoId = clip.youtubeVideoId
    if (!videoId) {
      return NextResponse.json({ error: 'Clip has no YouTube video ID' }, { status: 400 })
    }

    // Fetch transcript and description in parallel
    const [transcript, description] = await Promise.all([
      fetchYouTubeTranscript(videoId),
      fetchVideoDescription(videoId),
    ])

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript available for this video. It may not have captions enabled.' },
        { status: 404 }
      )
    }

    // Save transcript to the clip's script field
    await prisma.clip.update({
      where: { id },
      data: { script: transcript },
    })

    return NextResponse.json({
      success: true,
      transcript,
      description,
      charCount: transcript.length,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[transcript-api]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
