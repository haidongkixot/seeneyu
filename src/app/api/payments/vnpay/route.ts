import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createVNPayUrl } from '@/services/payment-gateway'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planSlug, period } = await req.json() as { planSlug: string; period: 'monthly' | 'annual' }
  const userId = (session.user as any).id

  const plan = await (prisma as any).plan.findUnique({ where: { slug: planSlug } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // VNPay works in VND — convert USD to VND (approximate rate)
  const usdAmount = period === 'annual' ? (plan.annualPrice ?? plan.monthlyPrice * 12) : plan.monthlyPrice
  if (usdAmount <= 0) return NextResponse.json({ error: 'Cannot pay for free plan' }, { status: 400 })
  const vndAmount = Math.round(usdAmount * 25000) // approximate USD→VND

  const orderId = `${userId.slice(-8)}_${Date.now()}`
  const ipAddr = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

  try {
    const paymentUrl = createVNPayUrl(
      vndAmount,
      orderId,
      `seeneyu ${plan.name} (${period})`,
      ipAddr
    )
    return NextResponse.json({ paymentUrl, orderId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
