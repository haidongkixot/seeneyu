import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // Auth required — prevent unauthenticated blob abuse
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Sign in to submit a recording' }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    const formData = await req.formData()
    const recording = formData.get('recording') as File | null
    const clipId = formData.get('clipId') as string | null

    if (!recording || !clipId) {
      return NextResponse.json({ error: 'Missing recording or clipId' }, { status: 400 })
    }

    // Verify clip exists
    const clip = await prisma.clip.findUnique({ where: { id: clipId } })
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    const ts = Date.now()

    // Upload recording to Vercel Blob
    const blob = await put(`recordings/${clipId}/${ts}.webm`, recording, {
      access: 'public',
      contentType: 'video/webm',
    })

    // Upload frame snapshots (sent as frame_0, frame_1, … by RecordClient)
    const frameUrls: string[] = []
    for (let i = 0; i < 4; i++) {
      const frame = formData.get(`frame_${i}`) as File | null
      if (!frame) break
      const frameBlob = await put(`frames/${clipId}/${ts}_${i}.jpg`, frame, {
        access: 'public',
        contentType: 'image/jpeg',
      })
      frameUrls.push(frameBlob.url)
    }

    // Create session record
    const userSession = await prisma.userSession.create({
      data: {
        userId,
        clipId,
        recordingUrl: blob.url,
        recordingKey: blob.pathname,
        frameUrls: frameUrls.length > 0 ? JSON.stringify(frameUrls) : null,
        status: 'uploaded',
      },
    })

    // Return sessionId immediately — FeedbackPoller will trigger the feedback call client-side
    return NextResponse.json({ sessionId: userSession.id })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
