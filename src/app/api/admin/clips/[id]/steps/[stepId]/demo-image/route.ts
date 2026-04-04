import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateImage, uploadToBlob } from '@/toolkit/ai-content-generator'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/** POST — generate an AI demo image for a practice step */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  try {
    await requireAdmin()
    const { id, stepId } = await params
    const body = await req.json()
    const { prompt, provider, model } = body as {
      prompt?: string
      provider?: string
      model?: string
    }

    const step = await prisma.practiceStep.findFirst({
      where: { id: stepId, clipId: id },
    })
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    // Build prompt from step instruction if not provided
    const imagePrompt = prompt || `A clean sketch-style illustration showing a person demonstrating: ${step.instruction}. Simple line drawing, educational coaching reference, white background, minimal detail.`

    const result = await generateImage(imagePrompt, provider || 'pollinations', model)
    const blobUrl = await uploadToBlob(result.buffer, `practice-demos-${id}`, stepId, result.mimeType)

    await prisma.practiceStep.update({
      where: { id: stepId },
      data: { demoImageUrl: blobUrl },
    })

    return NextResponse.json({ url: blobUrl })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
