import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
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
