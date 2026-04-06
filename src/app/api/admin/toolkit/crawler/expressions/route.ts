import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { importExpressionAssets } from '@/toolkit/data-crawler'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const label = searchParams.get('label')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (label) where.label = label
    if (status) where.status = status

    const [items, total] = await Promise.all([
      prisma.expressionAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expressionAsset.count({ where }),
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
    await requireAdmin()
    const body = await req.json()

    // Support both single asset and bulk import
    if (Array.isArray(body.assets)) {
      const result = await importExpressionAssets(body.assets)
      return NextResponse.json(result, { status: 201 })
    }

    // Single asset creation
    const { imageUrl, label, tags, sourceUrl, description, confidence } = body
    if (!imageUrl || !label) {
      return NextResponse.json({ error: 'imageUrl and label are required' }, { status: 400 })
    }

    const asset = await prisma.expressionAsset.create({
      data: {
        imageUrl,
        label: label.toLowerCase(),
        tags: tags ?? [],
        sourceUrl: sourceUrl ?? null,
        description: description ?? null,
        confidence: confidence ?? null,
        status: 'pending',
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
