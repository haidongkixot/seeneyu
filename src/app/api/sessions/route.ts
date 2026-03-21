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

    // Upload to Vercel Blob
    const filename = `recordings/${clipId}/${Date.now()}.webm`
    const blob = await put(filename, recording, {
      access: 'public',
      contentType: 'video/webm',
    })

    // Create session
    const session = await prisma.userSession.create({
      data: {
        clipId,
        recordingUrl: blob.url,
        recordingKey: blob.pathname,
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
