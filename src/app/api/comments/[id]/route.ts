import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeCommentBody } from '@/lib/sanitize'

const EDIT_WINDOW_MS = 15 * 60_000 // 15 minutes

/**
 * PATCH /api/comments/[id]
 * Edit own comment (within 15 minutes of creation).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    const comment = await prisma.comment.findUnique({ where: { id: params.id } })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const elapsed = Date.now() - comment.createdAt.getTime()
    if (elapsed > EDIT_WINDOW_MS) {
      return NextResponse.json({ error: 'Edit window has expired (15 minutes)' }, { status: 403 })
    }

    const json = await req.json()
    const rawBody = json.body as string | undefined
    if (!rawBody || !rawBody.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }

    const body = sanitizeCommentBody(rawBody)

    const updated = await prisma.comment.update({
      where: { id: params.id },
      data: { body },
      select: {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/comments/[id]
 * Delete own comment.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    const comment = await prisma.comment.findUnique({ where: { id: params.id } })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the comment (cascade will remove replies if it's a top-level comment)
    await prisma.comment.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
