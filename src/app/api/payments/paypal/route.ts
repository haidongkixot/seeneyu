import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPayPalOrder, capturePayPalOrder } from '@/services/payment-gateway'
import { activateSubscription } from '@/services/subscription-manager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planSlug, period } = await req.json() as { planSlug: string; period: 'monthly' | 'annual' }

  const plan = await (prisma as any).plan.findUnique({ where: { slug: planSlug } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const amount = period === 'annual' ? (plan.annualPrice ?? plan.monthlyPrice * 12) : plan.monthlyPrice
  if (amount <= 0) return NextResponse.json({ error: 'Cannot pay for free plan' }, { status: 400 })

  try {
    const { orderId, approveUrl } = await createPayPalOrder(
      amount,
      'USD',
      `seeneyu ${plan.name} (${period})`
    )
    return NextResponse.json({ orderId, approveUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const planSlug = searchParams.get('planSlug')
  const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'annual'

  if (!orderId || !planSlug) {
    return NextResponse.json({ error: 'orderId and planSlug required' }, { status: 400 })
  }

  try {
    const result = await capturePayPalOrder(orderId)
    if (result.status !== 'completed') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const userId = (session.user as any).id
    const plan = await (prisma as any).plan.findUnique({ where: { slug: planSlug } })
    const amount = period === 'annual' ? (plan.annualPrice ?? plan.monthlyPrice * 12) : plan.monthlyPrice

    await activateSubscription({ userId, planSlug, period, gateway: 'paypal', gatewayOrderId: orderId, amount, currency: 'USD' })

    return NextResponse.json({ status: 'success', planSlug })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
