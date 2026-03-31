import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/coupons/validate or /api/coupons/redeem — determined by action in body
// Or route this via a sub-path:
// POST /api/coupons  { action: 'validate' | 'redeem', code }

export async function POST(req: NextRequest) {
  const url = req.nextUrl.pathname
  const body = await req.json()

  if (url.endsWith('/validate') || body.action === 'validate') {
    return handleValidate(body)
  }
  if (url.endsWith('/redeem') || body.action === 'redeem') {
    return handleRedeem(req, body)
  }

  return NextResponse.json({ error: 'Specify action: validate or redeem' }, { status: 400 })
}

async function handleValidate(body: { code?: string }) {
  const { code } = body
  if (!code) return NextResponse.json({ valid: false, error: 'Code is required' }, { status: 400 })

  const coupon = await (prisma as any).coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon) return NextResponse.json({ valid: false, error: 'Invalid coupon code' })

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Coupon has expired' })
  }

  if (coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ valid: false, error: 'Coupon has reached maximum uses' })
  }

  return NextResponse.json({ valid: true, discountPct: coupon.discountPct })
}

async function handleRedeem(req: NextRequest, body: { code?: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string
  const { code } = body
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

  // Create redemption and increment usedCount
  await (prisma as any).couponRedemption.create({
    data: { couponId: coupon.id, userId },
  })
  await (prisma as any).coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  })

  return NextResponse.json({ success: true, discountPct: coupon.discountPct })
}
