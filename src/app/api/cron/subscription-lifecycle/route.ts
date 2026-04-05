/**
 * Subscription Lifecycle Cron — runs daily at 6AM UTC.
 *
 * Handles:
 * 1. Trial expiring (2 days before) → notification
 * 2. Trial expired → downgrade to basic
 * 3. Non-Stripe subscription expired → downgrade to basic
 * 4. Stripe handles its own renewal via webhooks
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let trialWarnings = 0
  let trialExpired = 0
  let subsExpired = 0

  try {
    // 1. Trial expiring in 2 days — send reminder
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const expiringTrials = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        trialEndsAt: { lte: twoDaysFromNow, gt: now },
      },
      include: { user: true },
    })

    for (const sub of expiringTrials) {
      // TODO: fire email trigger 'trial_expiring' when M72 is implemented
      console.log(`[lifecycle] trial expiring for user ${sub.userId} at ${sub.trialEndsAt}`)
      trialWarnings++
    }

    // 2. Trial expired — downgrade to basic
    const expiredTrials = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        trialEndsAt: { lte: now },
      },
    })

    for (const sub of expiredTrials) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'cancelled', cancelledAt: now },
      })
      await prisma.user.update({
        where: { id: sub.userId },
        data: { plan: 'basic' },
      })
      console.log(`[lifecycle] trial expired — downgraded user ${sub.userId} to basic`)
      trialExpired++
    }

    // 3. Non-Stripe subscriptions past endDate — downgrade
    // Stripe auto-renews via webhooks, so only check non-Stripe (PayPal/VNPay)
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: 'active',
        autoRenew: false, // PayPal/VNPay (manual renewal)
        endDate: { lte: now },
      },
    })

    for (const sub of expiredSubs) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'cancelled', cancelledAt: now },
      })
      await prisma.user.update({
        where: { id: sub.userId },
        data: { plan: 'basic' },
      })
      console.log(`[lifecycle] subscription expired — downgraded user ${sub.userId} to basic`)
      subsExpired++
    }

    console.log(`[lifecycle] done: ${trialWarnings} trial warnings, ${trialExpired} trials expired, ${subsExpired} subs expired`)

    return NextResponse.json({
      trialWarnings,
      trialExpired,
      subsExpired,
      processed: trialWarnings + trialExpired + subsExpired,
    })
  } catch (err: any) {
    console.error('[lifecycle] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
