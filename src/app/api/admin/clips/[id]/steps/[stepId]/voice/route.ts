import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAndUploadVoice } from '@/services/elevenlabs-tts'
import { del } from '@vercel/blob'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/** POST — generate ElevenLabs voice for a practice step */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  try {
    await requireAdmin()
    const { id, stepId } = await params

    const step = await prisma.practiceStep.findFirst({
      where: { id: stepId, clipId: id },
    })
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    // Build the voice text from instruction + optional tip
    let voiceText = step.instruction
    if (step.tip) voiceText += `. Tip: ${step.tip}`

    const voiceUrl = await generateAndUploadVoice(voiceText, id, step.stepNumber)

    await prisma.practiceStep.update({
      where: { id: stepId },
      data: { voiceUrl },
    })

    return NextResponse.json({ voiceUrl })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** DELETE — remove generated voice for a practice step */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  try {
    await requireAdmin()
    const { id, stepId } = await params

    const step = await prisma.practiceStep.findFirst({
      where: { id: stepId, clipId: id },
    })
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    if (step.voiceUrl) {
      await del(step.voiceUrl).catch(() => {})
    }

    await prisma.practiceStep.update({
      where: { id: stepId },
      data: { voiceUrl: null },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
