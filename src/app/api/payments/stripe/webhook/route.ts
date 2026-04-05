/**
 * Stripe Webhook — handles subscription lifecycle events.
 *
 * Events handled:
 * - checkout.session.completed → activate subscription
 * - invoice.paid → record payment, extend subscription
 * - invoice.payment_failed → notify user
 * - customer.subscription.updated → sync status
 * - customer.subscription.deleted → cancel + downgrade
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/services/stripe-gateway'
import { activateSubscription } from '@/services/subscription-manager'

// Disable body parsing — Stripe needs raw body for signature verification
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: any
  try {
    event = constructWebhookEvent(body, signature)
  } catch (err: any) {
    console.error('[stripe-webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[stripe-webhook] ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.seeneyu_user_id
        const planSlug = session.metadata?.plan_slug
        const period = session.metadata?.period || 'monthly'

        if (!userId || !planSlug) {
          console.warn('[stripe-webhook] missing metadata on checkout.session.completed')
          break
        }

        // Find the plan
        const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
        if (!plan) break

        // Activate subscription
        await activateSubscription({
          userId,
          planId: plan.id,
          planSlug,
          period,
          gateway: 'stripe',
          gatewayOrderId: session.subscription || session.id,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || 'usd',
          stripeCustomerId: session.customer,
          stripeSubId: session.subscription,
        })

        console.log(`[stripe-webhook] activated ${planSlug} for user ${userId}`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const sub = invoice.subscription
        if (!sub) break

        // Find our subscription by stripeSubId
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubId: String(sub) },
        })
        if (!subscription) break

        // Record the payment
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            gateway: 'stripe',
            gatewayOrderId: invoice.id,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency || 'usd',
            status: 'completed',
            invoiceUrl: invoice.hosted_invoice_url || null,
          },
        })

        // Extend subscription end date
        const periodEnd = invoice.lines?.data?.[0]?.period?.end
        if (periodEnd) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { endDate: new Date(periodEnd * 1000), status: 'active' },
          })
        }

        console.log(`[stripe-webhook] invoice.paid for subscription ${subscription.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const sub = invoice.subscription
        if (!sub) break

        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubId: String(sub) },
        })
        if (!subscription) break

        // Record failed payment
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            gateway: 'stripe',
            gatewayOrderId: invoice.id,
            amount: (invoice.amount_due || 0) / 100,
            currency: invoice.currency || 'usd',
            status: 'failed',
          },
        })

        console.log(`[stripe-webhook] invoice.payment_failed for subscription ${subscription.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
          include: { user: true },
        })
        if (!subscription) break

        // Cancel and downgrade
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })

        await prisma.user.update({
          where: { id: subscription.userId },
          data: { plan: 'basic' },
        })

        console.log(`[stripe-webhook] subscription.deleted — downgraded user ${subscription.userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
        })
        if (!subscription) break

        // Sync status
        const statusMap: Record<string, string> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'active', // still active, payment retry in progress
          canceled: 'cancelled',
          unpaid: 'cancelled',
        }

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: statusMap[sub.status] || subscription.status,
            autoRenew: !sub.cancel_at_period_end,
          },
        })
        break
      }
    }
  } catch (err: any) {
    console.error(`[stripe-webhook] error handling ${event.type}:`, err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
