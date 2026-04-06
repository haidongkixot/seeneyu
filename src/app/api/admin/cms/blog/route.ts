import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '0')
    const limit = parseInt(searchParams.get('limit') ?? '20')

    const category = searchParams.get('category')
    const where = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: page * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ])

    return NextResponse.json({ posts, total, page, limit })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const { slug, title, excerpt, body: postBody, coverImage, tags, status, category } = body

    if (!slug || !title || !postBody) {
      return NextResponse.json({ error: 'slug, title, and body are required' }, { status: 400 })
    }

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt: excerpt ?? null,
        body: postBody,
        coverImage: coverImage ?? null,
        tags: tags ?? null,
        status: status ?? 'draft',
        category: category ?? 'blog',
        authorId: (session.user as any).id ?? null,
        publishedAt: status === 'published' ? new Date() : null,
      },
    })
    return NextResponse.json(post, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
