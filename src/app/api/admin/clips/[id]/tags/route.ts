import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/** GET — list all tags for a clip */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const tags = await prisma.clipTag.findMany({
      where: { clipId: id },
      orderBy: [{ category: 'asc' }, { value: 'asc' }],
    })
    return NextResponse.json({ tags })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** PUT — add a tag to a clip */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { category, value } = await req.json()
    if (!category || !value) {
      return NextResponse.json({ error: 'category and value required' }, { status: 400 })
    }
    const tag = await prisma.clipTag.upsert({
      where: { clipId_category_value: { clipId: id, category, value } },
      update: { source: 'manual', confidence: 1.0 },
      create: { clipId: id, category, value, source: 'manual', confidence: 1.0 },
    })
    return NextResponse.json({ tag })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** DELETE — remove a tag from a clip */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const tagId = searchParams.get('tagId')
    if (!tagId) return NextResponse.json({ error: 'tagId required' }, { status: 400 })
    await prisma.clipTag.delete({ where: { id: tagId, clipId: id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
