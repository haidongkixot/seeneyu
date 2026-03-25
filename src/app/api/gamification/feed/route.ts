import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    // Get list of followed user IDs
    const following = await prisma.userFollow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    })

    const followingIds = following.map((f) => f.followingId)

    if (followingIds.length === 0) {
      return NextResponse.json({ items: [], nextCursor: null })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch XP transactions from followed users
    const xpTransactions = await prisma.xpTransaction.findMany({
      where: {
        userId: { in: followingIds },
        createdAt: { gte: sevenDaysAgo },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Fetch badges earned by followed users
    const badges = await prisma.userBadge.findMany({
      where: {
        userId: { in: followingIds },
        earnedAt: { gte: sevenDaysAgo },
      },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
      take: limit,
    })

    // Get user info for all activity
    const activityUserIds = Array.from(new Set([
      ...xpTransactions.map((t) => t.userId),
      ...badges.map((b) => b.userId),
    ]))

    const users = await prisma.user.findMany({
      where: { id: { in: activityUserIds } },
      select: { id: true, name: true, image: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Merge and sort activities
    type FeedItem = {
      id: string
      type: 'xp_gain' | 'badge_earned'
      userId: string
      userName: string
      userImage: string | null
      description: string
      timestamp: string
    }

    const items: FeedItem[] = []

    for (const tx of xpTransactions) {
      const user = userMap.get(tx.userId)
      items.push({
        id: `xp-${tx.id}`,
        type: 'xp_gain',
        userId: tx.userId,
        userName: user?.name ?? 'Anonymous',
        userImage: user?.image ?? null,
        description: `gained ${tx.amount} XP from ${tx.source.replace(/_/g, ' ')}`,
        timestamp: tx.createdAt.toISOString(),
      })
    }

    for (const ub of badges) {
      const user = userMap.get(ub.userId)
      items.push({
        id: `badge-${ub.id}`,
        type: 'badge_earned',
        userId: ub.userId,
        userName: user?.name ?? 'Anonymous',
        userImage: user?.image ?? null,
        description: `earned the ${ub.badge.name} badge`,
        timestamp: ub.earnedAt.toISOString(),
      })
    }

    // Sort by timestamp descending, take limit
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const pagedItems = items.slice(0, limit)

    const nextCursor = pagedItems.length === limit
      ? pagedItems[pagedItems.length - 1].id
      : null

    return NextResponse.json({ items: pagedItems, nextCursor })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
