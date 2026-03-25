import { prisma } from '@/lib/prisma'

export async function activateSubscription(
  userId: string,
  planSlug: string,
  period: 'monthly' | 'annual',
  gateway: string,
  gatewayOrderId: string,
  amount: number,
  currency: string
) {
  const plan = await (prisma as any).plan.findUnique({ where: { slug: planSlug } })
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
