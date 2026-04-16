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
  const userId = (session.user as any).id as string

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

    // HIGH-001: Bind orderId → user/plan server-side so capture can't be tampered with.
    await (prisma as any).paymentIntent.create({
      data: {
        orderId,
        userId,
        planSlug,
        period,
        amount,
        currency: 'USD',
        gateway: 'paypal',
        status: 'pending',
      },
    })

    return NextResponse.json({ orderId, approveUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  }

  // HIGH-001: Plan/period/user all come from the server-side PaymentIntent,
  // not URL params, so the client can't tamper with what gets activated.
  const intent = await (prisma as any).paymentIntent.findUnique({ where: { orderId } })
  if (!intent || intent.gateway !== 'paypal' || intent.userId !== userId) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Replay guard — once completed, short-circuit.
  if (intent.status === 'completed') {
    return NextResponse.json({ status: 'success', planSlug: intent.planSlug })
  }

  try {
    const result = await capturePayPalOrder(orderId)
    if (result.status !== 'completed') {
      await (prisma as any).paymentIntent.update({
        where: { orderId },
        data: { status: 'failed' },
      }).catch(() => {})
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    await activateSubscription({
      userId: intent.userId,
      planSlug: intent.planSlug,
      period: intent.period as 'monthly' | 'annual',
      gateway: 'paypal',
      gatewayOrderId: orderId,
      amount: intent.amount,
      currency: 'USD',
    })

    await (prisma as any).paymentIntent.update({
      where: { orderId },
      data: { status: 'completed' },
    })

    return NextResponse.json({ status: 'success', planSlug: intent.planSlug })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
