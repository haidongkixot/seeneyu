import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [followingCount, followersCount, following] = await Promise.all([
      prisma.userFollow.count({ where: { followerId: userId } }),
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
    ])

    return NextResponse.json({
      followingCount,
      followersCount,
      followingIds: following.map((f) => f.followingId),
    })
  } catch (error) {
    console.error('Follow GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch follow data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId } = await request.json()
    if (!targetUserId || targetUserId === userId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.userFollow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    })

    return NextResponse.json({ success: true, following: true })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: true, following: true, message: 'Already following' })
    }
    console.error('Follow POST error:', error)
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId } = await request.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    await prisma.userFollow.deleteMany({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    })

    return NextResponse.json({ success: true, following: false })
  } catch (error) {
    console.error('Follow DELETE error:', error)
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
  }
}
