import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { validateUpload, VIDEO_UPLOAD } from '@/lib/upload-validator'
import { checkUserRateLimit, AI_FEEDBACK_LIMIT } from '@/lib/rate-limit-user'

export async function POST(req: NextRequest) {
  try {
    // Auth required — prevent unauthenticated blob abuse
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Sign in to submit a recording' }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    // HIGH-003: Per-user rate limit (15 recordings / hour)
    const rl = checkUserRateLimit({ key: 'sessions:upload', userId, ...AI_FEEDBACK_LIMIT })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many practice uploads. Please try again later.' },
        { status: 429 },
      )
    }

    const formData = await req.formData()
    const recording = formData.get('recording') as File | null
    const clipId = formData.get('clipId') as string | null

    if (!recording || !clipId) {
      return NextResponse.json({ error: 'Missing recording or clipId' }, { status: 400 })
    }

    // HIGH-004: Validate file type and size
    const uploadCheck = validateUpload(recording, VIDEO_UPLOAD)
    if (!uploadCheck.valid) {
      return NextResponse.json({ error: uploadCheck.error }, { status: 400 })
    }

    // Verify clip exists
    const clip = await prisma.clip.findUnique({ where: { id: clipId } })
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    // CRIT-001: Opaque UUID path so recording URLs cannot be enumerated.
    // Paths are further randomised by Vercel Blob's default addRandomSuffix.
    const uploadToken = randomUUID()

    // Upload recording to Vercel Blob
    const blob = await put(`recordings/${userId}/${uploadToken}.webm`, recording, {
      access: 'public',
      contentType: 'video/webm',
      addRandomSuffix: true,
    })

    // Upload frame snapshots (sent as frame_0, frame_1, … by RecordClient)
    const frameUrls: string[] = []
    for (let i = 0; i < 4; i++) {
      const frame = formData.get(`frame_${i}`) as File | null
      if (!frame) break
      const frameBlob = await put(`frames/${userId}/${uploadToken}_${i}.jpg`, frame, {
        access: 'public',
        contentType: 'image/jpeg',
        addRandomSuffix: true,
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
