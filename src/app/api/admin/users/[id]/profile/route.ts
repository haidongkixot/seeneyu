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
        image: true,
        role: true,
        status: true,
        statusNote: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        location: true,
        plan: true,
        approvedAt: true,
        approvedBy: true,
        onboardingComplete: true,
        createdAt: true,
        updatedAt: true,
        gamification: true,
        subscriptions: {
          where: { status: 'active' },
          include: { plan: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            userSessions: true,
            arcadeAttempts: true,
            comments: true,
            assistantConversations: true,
          },
        },
      },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { bio, phone, location, avatarUrl } = body

    const updateData: Record<string, unknown> = {}
    if (bio !== undefined) updateData.bio = bio
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        bio: true,
        phone: true,
        location: true,
        avatarUrl: true,
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
