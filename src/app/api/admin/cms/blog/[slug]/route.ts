import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await requireAdmin()
    const post = await prisma.blogPost.findUnique({
      where: { slug: params.slug },
    })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { title, excerpt, body: postBody, coverImage, tags, status, slug: newSlug } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (postBody !== undefined) updateData.body = postBody
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (tags !== undefined) updateData.tags = tags
    if (newSlug !== undefined) updateData.slug = newSlug
    if (status !== undefined) {
      updateData.status = status
      if (status === 'published') updateData.publishedAt = new Date()
    }

    const post = await prisma.blogPost.update({
      where: { slug: params.slug },
      data: updateData,
    })
    return NextResponse.json(post)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await requireAdmin()
    await prisma.blogPost.delete({ where: { slug: params.slug } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
