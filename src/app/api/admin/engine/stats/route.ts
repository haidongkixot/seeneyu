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

export async function GET() {
  try {
    await requireAdmin()

    // Aggregated stats by channel
    const byChannel = await prisma.notificationLog.groupBy({
      by: ['channel', 'deliveryStatus'],
      _count: { id: true },
    })

    // Aggregated stats by triggerType
    const byTrigger = await prisma.notificationLog.groupBy({
      by: ['triggerType', 'deliveryStatus'],
      _count: { id: true },
    })

    // Total counts
    const totalSent = await prisma.notificationLog.count()
    const totalDelivered = await prisma.notificationLog.count({
      where: { deliveryStatus: 'delivered' },
    })
    const totalOpened = await prisma.notificationLog.count({
      where: { openedAt: { not: null } },
    })
    const totalClicked = await prisma.notificationLog.count({
      where: { clickedAt: { not: null } },
    })

    // Engagement score distribution
    const profiles = await prisma.learnerProfile.findMany({
      select: { engagementScore: true },
    })
    const distribution: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    }
    for (const p of profiles) {
      const s = p.engagementScore
      if (s <= 20) distribution['0-20']++
      else if (s <= 40) distribution['21-40']++
      else if (s <= 60) distribution['41-60']++
      else if (s <= 80) distribution['61-80']++
      else distribution['81-100']++
    }

    return NextResponse.json({
      total: { sent: totalSent, delivered: totalDelivered, opened: totalOpened, clicked: totalClicked },
      openRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
      clickRate: totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 100) : 0,
      byChannel,
      byTrigger,
      engagementDistribution: distribution,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
