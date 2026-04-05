/**
 * Stripe Gateway — handles Checkout Sessions, Customer Portal, and Webhooks.
 *
 * Stripe manages: auto-renewal, invoices, payment methods, refunds.
 * Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 */

import Stripe from 'stripe'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, { apiVersion: '2025-04-30.basil' })
}

// ── Customer Management ─────────────────────────────────────────

export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string,
): Promise<string> {
  const stripe = getStripe()

  // Check if customer already exists (search by metadata)
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0].id

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { seeneyu_user_id: userId },
  })
  return customer.id
}

// ── Checkout Session ────────────────────────────────────────────

export interface CheckoutParams {
  userId: string
  email: string
  name?: string
  planSlug: string
  planName: string
  amount: number        // in cents (e.g., 999 = $9.99)
  currency?: string
  period: 'monthly' | 'annual'
  couponCode?: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(params: CheckoutParams): Promise<{
  sessionId: string
  url: string
}> {
  const stripe = getStripe()
  const customerId = await getOrCreateCustomer(params.userId, params.email, params.name)

  // Build session params (use any to avoid Stripe version-specific type issues)
  const sessionParams: any = {
    mode: 'subscription',
    customer: customerId,
    line_items: [{
      price_data: {
        currency: params.currency || 'usd',
        product_data: {
          name: `seeneyu ${params.planName} Plan`,
          description: `${params.period === 'annual' ? 'Annual' : 'Monthly'} subscription`,
        },
        unit_amount: params.amount,
        recurring: {
          interval: params.period === 'annual' ? 'year' : 'month',
        },
      },
      quantity: 1,
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      seeneyu_user_id: params.userId,
      plan_slug: params.planSlug,
      period: params.period,
    },
    subscription_data: {
      metadata: {
        seeneyu_user_id: params.userId,
        plan_slug: params.planSlug,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    payment_method_types: ['card'],
  }

  // Apply coupon if provided (as Stripe promotion code)
  if (params.couponCode) {
    try {
      const promos = await stripe.promotionCodes.list({ code: params.couponCode, active: true, limit: 1 })
      if (promos.data.length > 0) {
        sessionParams.discounts = [{ promotion_code: promos.data[0].id }]
        delete sessionParams.allow_promotion_codes
      }
    } catch {
      // Coupon not found in Stripe — ignore
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return { sessionId: session.id, url: session.url! }
}

// ── Customer Portal ─────────────────────────────────────────────

export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

// ── Webhook Verification ────────────────────────────────────────

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  return stripe.webhooks.constructEvent(body, signature, secret)
}

// ── Subscription Retrieval ──────────────────────────────────────

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe()
  return stripe.subscriptions.retrieve(subscriptionId)
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}
