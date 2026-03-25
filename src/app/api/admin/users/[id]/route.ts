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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        statusNote: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
        userSessions: {
          orderBy: { createdAt: 'desc' },
          include: { clip: { select: { movieTitle: true, skillCategory: true } } },
        },
      },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'suspended']

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()
    const { id } = params
    const body = await req.json()
    const { status, statusNote, role } = body

    const updateData: Record<string, unknown> = {}

    // Handle status change
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
      if (statusNote !== undefined) {
        updateData.statusNote = statusNote
      }
      if (status === 'approved') {
        updateData.approvedAt = new Date()
        updateData.approvedBy = (session.user as any).id
      }
    }

    // Handle role change
    if (role) {
      if (!['learner', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        statusNote: true,
        approvedAt: true,
        approvedBy: true,
      },
    })

    return NextResponse.json(user)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
