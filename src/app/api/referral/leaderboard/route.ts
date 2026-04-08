import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Get top 10 referrers by converted referrals
  const results = await (prisma as any).referral.groupBy({
    by: ['referrerId'],
    where: { status: 'converted' },
    _count: { referrerId: true },
    orderBy: { _count: { referrerId: 'desc' } },
    take: 10,
  })

  const leaderboard = await Promise.all(
    results.map(async (r: { referrerId: string; _count: { referrerId: number } }, i: number) => {
      const user = await prisma.user.findUnique({
        where: { id: r.referrerId },
        select: { name: true },
      })
      const conversions = r._count.referrerId
      // 1 month free per conversion
      const rewardMonths = conversions

      return {
        rank: i + 1,
        name: (user?.name ?? 'Anonymous').slice(0, 8),
        conversions,
        reward: `${rewardMonths} month${rewardMonths !== 1 ? 's' : ''} free`,
      }
    })
  )

  return NextResponse.json({ leaderboard })
}
