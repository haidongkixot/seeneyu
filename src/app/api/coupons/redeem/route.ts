import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string
  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const coupon = await (prisma as any).coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
  }

  if (coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Coupon has reached maximum uses' }, { status: 400 })
  }

  // Check if user already redeemed
  const existing = await (prisma as any).couponRedemption.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId } },
  })
  if (existing) return NextResponse.json({ error: 'You have already redeemed this coupon' }, { status: 409 })

  await (prisma as any).couponRedemption.create({
    data: { couponId: coupon.id, userId },
  })
  await (prisma as any).coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  })

  return NextResponse.json({ success: true, discountPct: coupon.discountPct })
}
