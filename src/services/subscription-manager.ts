import { prisma } from '@/lib/prisma'

interface ActivateParams {
  userId: string
  planId?: string
  planSlug: string
  period: string
  gateway: string
  gatewayOrderId: string
  amount: number
  currency?: string
  couponId?: string
  discount?: number
  stripeCustomerId?: string
  stripeSubId?: string
  invoiceUrl?: string
}

export async function activateSubscription(params: ActivateParams) {
  const {
    userId, planSlug, period, gateway, gatewayOrderId,
    amount, currency = 'usd', couponId, discount = 0,
    stripeCustomerId, stripeSubId, invoiceUrl,
  } = params

  const plan = params.planId
    ? await (prisma as any).plan.findUnique({ where: { id: params.planId } })
    : await (prisma as any).plan.findUnique({ where: { slug: planSlug } })
  if (!plan) throw new Error('Plan not found')

  // Cancel any existing active subscription
  await (prisma as any).subscription.updateMany({
    where: { userId, status: 'active' },
    data: { status: 'cancelled', cancelledAt: new Date() },
  })

  // Create new subscription
  const endDate = new Date()
  if (period === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1)
  } else {
    endDate.setMonth(endDate.getMonth() + 1)
  }

  const subscription = await (prisma as any).subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: 'active',
      period,
      endDate,
      autoRenew: gateway === 'stripe', // Stripe auto-renews, others manual
      stripeCustomerId: stripeCustomerId || null,
      stripeSubId: stripeSubId || null,
    },
  })

  // Record payment
  await (prisma as any).payment.create({
    data: {
      subscriptionId: subscription.id,
      gateway,
      gatewayOrderId,
      amount,
      currency,
      status: 'completed',
      discount,
      couponId: couponId || null,
      invoiceUrl: invoiceUrl || null,
    },
  })

  // Update user plan
  await prisma.user.update({
    where: { id: userId },
    data: { plan: planSlug },
  })

  return subscription
}

export async function getUserSubscription(userId: string) {
  return (prisma as any).subscription.findFirst({
    where: { userId, status: 'active' },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function cancelSubscription(subscriptionId: string, userId: string) {
  const sub = await (prisma as any).subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  })
  if (!sub || sub.userId !== userId) throw new Error('Subscription not found')

  await (prisma as any).subscription.update({
    where: { id: subscriptionId },
    data: { status: 'cancelled', cancelledAt: new Date() },
  })

  // Revert user to basic
  await prisma.user.update({
    where: { id: userId },
    data: { plan: 'basic' },
  })

  return sub
}
