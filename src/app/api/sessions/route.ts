import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
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
    const session = await prisma.userSession.create({
      data: {
        clipId,
        recordingUrl: blob.url,
        recordingKey: blob.pathname,
        frameUrls: frameUrls.length > 0 ? JSON.stringify(frameUrls) : null,
        status: 'uploaded',
      },
    })

    // Kick off AI feedback (non-blocking — runs in background)
    fetch(`${req.nextUrl.origin}/api/sessions/${session.id}/feedback`, {
      method: 'POST',
    }).catch(console.error)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
