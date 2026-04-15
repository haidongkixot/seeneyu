import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 days

  // Find the standard plan
  const standardPlan = await prisma.plan.findFirst({ where: { slug: 'standard' } })
  if (!standardPlan) return NextResponse.json({ error: 'Standard plan not found' }, { status: 500 })

  // MED-004: Check if user already used a trial — prevent repeats
  const pastTrial = await (prisma.subscription as any).findFirst({
    where: { userId, trialStartedAt: { not: null } },
  })
  if (pastTrial) {
    return NextResponse.json({ error: 'You have already used your free trial' }, { status: 400 })
  }

  // Find or create subscription
  const existing = await prisma.subscription.findFirst({ where: { userId, status: { not: 'cancelled' } } })

  if (existing) {
    // Update with trial info
    await (prisma.subscription as any).update({
      where: { id: existing.id },
      data: {
        trialStartedAt: now,
        trialEndsAt,
        planId: standardPlan.id,
        status: 'trialing',
      },
    })
  } else {
    await (prisma.subscription as any).create({
      data: {
        userId,
        planId: standardPlan.id,
        status: 'trialing',
        period: 'monthly',
        trialStartedAt: now,
        trialEndsAt,
      },
    })
  }

  // Update user plan to standard during trial
  await prisma.user.update({ where: { id: userId }, data: { plan: 'standard' } })

  return NextResponse.json({ success: true, trialEndsAt })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const subscription = await (prisma.subscription as any).findFirst({
    where: { userId, status: 'trialing' },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription || !subscription.trialEndsAt) {
    return NextResponse.json({ active: false, trialEndsAt: null, daysLeft: 0 })
  }

  const now = new Date()
  const trialEndsAt = new Date(subscription.trialEndsAt)
  const active = trialEndsAt > now
  const daysLeft = active ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

  return NextResponse.json({ active, trialEndsAt, daysLeft })
}
