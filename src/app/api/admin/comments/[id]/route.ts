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

/**
 * PATCH /api/admin/comments/[id]
 * Admin: hide or unhide a comment.
 * Body: { isHidden: boolean }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()
    const adminId = (session.user as any).id as string

    const json = await req.json()
    const isHidden = json.isHidden as boolean

    if (typeof isHidden !== 'boolean') {
      return NextResponse.json({ error: 'isHidden must be a boolean' }, { status: 400 })
    }

    const comment = await prisma.comment.update({
      where: { id: params.id },
      data: {
        isHidden,
        hiddenBy: isHidden ? adminId : null,
        hiddenAt: isHidden ? new Date() : null,
      },
      select: {
        id: true,
        isHidden: true,
        hiddenBy: true,
        hiddenAt: true,
      },
    })

    return NextResponse.json(comment)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/comments/[id]
 * Admin: permanently delete a comment.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    await prisma.comment.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
