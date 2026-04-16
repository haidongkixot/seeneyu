import { NextResponse } from 'next/server'
import { verifyVNPayCallback } from '@/services/payment-gateway'
import { activateSubscription } from '@/services/subscription-manager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query: Record<string, string> = {}
  searchParams.forEach((v, k) => { query[k] = v })

  // HIGH-002: HMAC-SHA512 signature verification on every callback param.
  const { valid, orderId, responseCode } = verifyVNPayCallback(query)

  if (!valid) {
    return NextResponse.redirect(new URL('/pricing?error=invalid_signature', req.url))
  }

  if (responseCode !== '00') {
    return NextResponse.redirect(new URL('/pricing?error=payment_failed', req.url))
  }

  // HIGH-001: Retrieve payment intent by EXACT orderId match.
  // No more substring/endsWith matching against user IDs.
  const intent = await (prisma as any).paymentIntent.findUnique({ where: { orderId } })
  if (!intent || intent.gateway !== 'vnpay') {
    return NextResponse.redirect(new URL('/pricing?error=order_not_found', req.url))
  }

  // Prevent replay: if already completed, just redirect
  if (intent.status === 'completed') {
    return NextResponse.redirect(new URL(`/payment/success?plan=${intent.planSlug}`, req.url))
  }

  try {
    await activateSubscription({
      userId: intent.userId,
      planSlug: intent.planSlug,
      period: intent.period as 'monthly' | 'annual',
      gateway: 'vnpay',
      gatewayOrderId: orderId,
      amount: intent.amount,
      currency: 'VND',
    })

    await (prisma as any).paymentIntent.update({
      where: { orderId },
      data: { status: 'completed' },
    })

    return NextResponse.redirect(new URL(`/payment/success?plan=${intent.planSlug}`, req.url))
  } catch {
    await (prisma as any).paymentIntent.update({
      where: { orderId },
      data: { status: 'failed' },
    }).catch(() => {})
    return NextResponse.redirect(new URL('/pricing?error=activation_failed', req.url))
  }
}
