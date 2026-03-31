import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, newUserId } = await req.json()

  if (!code || !newUserId) {
    return NextResponse.json({ error: 'code and newUserId are required' }, { status: 400 })
  }

  const referral = await (prisma as any).referral.findUnique({ where: { code } })
  if (!referral) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })

  if (referral.status === 'converted') {
    return NextResponse.json({ error: 'Referral already converted' }, { status: 409 })
  }

  // Update referral record
  await (prisma as any).referral.update({
    where: { id: referral.id },
    data: {
      referredId: newUserId,
      status: 'converted',
      convertedAt: new Date(),
    },
  })

  // Give referrer 1 month free — extend their subscription endDate by 30 days
  const referrerSub = await prisma.subscription.findFirst({
    where: { userId: referral.referrerId, status: { not: 'cancelled' } },
    orderBy: { createdAt: 'desc' },
  })

  if (referrerSub) {
    const currentEnd = referrerSub.endDate ?? new Date()
    const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000)
    await prisma.subscription.update({
      where: { id: referrerSub.id },
      data: { endDate: newEnd },
    })
  }

  return NextResponse.json({ success: true })
}
