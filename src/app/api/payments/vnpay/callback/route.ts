import { NextResponse } from 'next/server'
import { verifyVNPayCallback } from '@/services/payment-gateway'
import { activateSubscription } from '@/services/subscription-manager'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query: Record<string, string> = {}
  searchParams.forEach((v, k) => { query[k] = v })

  const { valid, orderId, responseCode } = verifyVNPayCallback(query)

  if (!valid) {
    return NextResponse.redirect(new URL('/pricing?error=invalid_signature', req.url))
  }

  if (responseCode !== '00') {
    return NextResponse.redirect(new URL('/pricing?error=payment_failed', req.url))
  }

  // Extract userId from orderId format: userId-last8_timestamp
  // We store planSlug+period in a pending payment record, or pass via vnp_OrderInfo
  // For simplicity, parse from the order info
  const orderInfo = searchParams.get('vnp_OrderInfo') || ''
  const planMatch = orderInfo.match(/seeneyu (\w+) \((\w+)\)/)
  const planName = planMatch?.[1]?.toLowerCase()
  const period = (planMatch?.[2] || 'monthly') as 'monthly' | 'annual'

  // Find the plan by name (case-insensitive)
  const plan = await (prisma as any).plan.findFirst({
    where: { name: { contains: planName || '', mode: 'insensitive' } },
  })

  if (!plan) {
    return NextResponse.redirect(new URL('/pricing?error=plan_not_found', req.url))
  }

  // Find user by orderId prefix
  const userIdSuffix = orderId.split('_')[0]
  const user = await prisma.user.findFirst({
    where: { id: { endsWith: userIdSuffix } },
  })

  if (!user) {
    return NextResponse.redirect(new URL('/pricing?error=user_not_found', req.url))
  }

  const amount = parseFloat(searchParams.get('vnp_Amount') || '0') / 100

  try {
    await activateSubscription({ userId: user.id, planSlug: plan.slug, period, gateway: 'vnpay', gatewayOrderId: orderId, amount, currency: 'VND' })
    return NextResponse.redirect(new URL(`/payment/success?plan=${plan.slug}`, req.url))
  } catch {
    return NextResponse.redirect(new URL('/pricing?error=activation_failed', req.url))
  }
}
