import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { crawlArticle } from '@/toolkit/data-crawler'
import type { ContentSourceType } from '@/toolkit/data-crawler/types'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

const VALID_TYPES: ContentSourceType[] = ['article', 'research_paper', 'expression_db', 'youtube_timestamp']
const VALID_STATUSES = ['raw', 'curated', 'published', 'rejected']

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (type && VALID_TYPES.includes(type as ContentSourceType)) {
      where.type = type
    }
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.contentSource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contentSource.count({ where }),
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
    const { url, type, title, crawl } = body

    if (!url || !type) {
      return NextResponse.json({ error: 'url and type are required' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    let rawContent: string | null = null
    let resolvedTitle = title || url

    // Auto-crawl if requested and type is article/research_paper
    if (crawl && (type === 'article' || type === 'research_paper')) {
      try {
        const crawled = await crawlArticle(url)
        rawContent = crawled.bodyText.slice(0, 50000) // Cap at 50KB
        resolvedTitle = title || crawled.title
      } catch (crawlErr: any) {
        // Continue with manual entry if crawl fails
        rawContent = null
        resolvedTitle = title || url
      }
    }

    const source = await prisma.contentSource.create({
      data: {
        type,
        url,
        title: resolvedTitle,
        rawContent,
        metadata: body.metadata ?? undefined,
        status: 'raw',
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
