import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDescription } from '@/toolkit/ai-content-generator'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

const VALID_STATUSES = ['draft', 'generating', 'review', 'published', 'failed']

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const expressionType = searchParams.get('expressionType')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }
    if (expressionType) {
      where.expressionType = expressionType
    }

    const [items, total] = await Promise.all([
      prisma.aiContentRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { assets: true } },
          assets: {
            select: { id: true, status: true, blobUrl: true, type: true },
          },
        },
      }),
      prisma.aiContentRequest.count({ where }),
    ])

    return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const { expressionType, bodyLanguageType, scenePrompt, provider, model } = body

    if (!expressionType || !bodyLanguageType) {
      return NextResponse.json(
        { error: 'expressionType and bodyLanguageType are required' },
        { status: 400 },
      )
    }

    // Generate structured description via GPT-4o-mini
    let generatedDescription = null
    let imagePrompt = null
    let videoPrompt = null

    try {
      const desc = await generateDescription(expressionType, bodyLanguageType, scenePrompt)
      generatedDescription = desc as any
      imagePrompt = desc.imagePrompt
      videoPrompt = desc.videoPrompt
    } catch (err) {
      // Fallback: build simple prompts if OpenAI is unavailable
      imagePrompt = `Photorealistic portrait of a person showing ${expressionType} emotion with clear ${bodyLanguageType.replace(/-/g, ' ')} body language. ${scenePrompt || 'Professional studio lighting, neutral background.'} High quality, detailed expression.`
      videoPrompt = `Subtle animation of a person expressing ${expressionType} with ${bodyLanguageType.replace(/-/g, ' ')}. Slight head movement, natural blinking.`
    }

    const request = await prisma.aiContentRequest.create({
      data: {
        expressionType,
        bodyLanguageType,
        scenePrompt: scenePrompt || null,
        generatedDescription,
        imagePrompt,
        videoPrompt,
        provider: provider || 'pollinations',
        model: model || null,
        status: 'draft',
        createdBy: (session.user as any).id || 'admin',
      },
    })

    return NextResponse.json(request, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
