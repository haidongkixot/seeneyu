/**
 * Stripe Checkout — create a Checkout Session for subscription purchase.
 * POST { planSlug, period, couponCode? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/services/stripe-gateway'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Sign in to subscribe' }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    const { planSlug, period, couponCode } = await req.json()

    if (!planSlug || !period) {
      return NextResponse.json({ error: 'planSlug and period are required' }, { status: 400 })
    }

    // Look up plan
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const price = period === 'annual' && plan.annualPrice
      ? plan.annualPrice
      : plan.monthlyPrice

    if (price <= 0) {
      return NextResponse.json({ error: 'Cannot purchase free plan via Stripe' }, { status: 400 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000'

    const { sessionId, url } = await createCheckoutSession({
      userId,
      email: session.user.email,
      name: session.user.name || undefined,
      planSlug,
      planName: plan.name,
      amount: Math.round(price * 100), // dollars to cents
      period: period as 'monthly' | 'annual',
      couponCode,
      successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&gateway=stripe`,
      cancelUrl: `${baseUrl}/checkout?plan=${planSlug}&period=${period}`,
    })

    return NextResponse.json({ sessionId, url })
  } catch (err: any) {
    console.error('[stripe] checkout error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
