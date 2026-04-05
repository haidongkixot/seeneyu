/**
 * Stripe Customer Portal — self-service for invoices, payment method, cancellation.
 * POST → returns portal URL
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPortalSession } from '@/services/stripe-gateway'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id as string

    // Find user's active subscription with Stripe customer ID
    const subscription = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe subscription found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000'
    const url = await createPortalSession(subscription.stripeCustomerId, `${baseUrl}/settings/notifications`)

    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
