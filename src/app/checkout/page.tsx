'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, CreditCard, Shield, CheckCircle, Loader2, Tag, X,
} from 'lucide-react'

interface PlanData {
  slug: string
  name: string
  monthlyPrice: number
  annualPrice: number | null
  features: any
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const planSlug = searchParams.get('plan') || 'standard'
  const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'annual'

  const [plan, setPlan] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'vnpay'>('stripe')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ discountPct: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/auth/signin')
  }, [authStatus, router])

  useEffect(() => {
    fetch('/api/subscriptions')
      .then((r) => r.json())
      .then((data) => {
        // Fetch plan details from pricing
        return fetch(`/api/admin/plans?slug=${planSlug}`)
      })
      .then((r) => r.json())
      .then((data) => {
        if (data.plan) setPlan(data.plan)
        else if (data.slug) setPlan(data)
      })
      .catch(() => {
        // Fallback: use hardcoded plan data
        const plans: Record<string, PlanData> = {
          standard: { slug: 'standard', name: 'Standard', monthlyPrice: 9.99, annualPrice: 99.99, features: {} },
          advanced: { slug: 'advanced', name: 'Advanced', monthlyPrice: 19.99, annualPrice: 199.99, features: {} },
        }
        setPlan(plans[planSlug] || plans.standard)
      })
      .finally(() => setLoading(false))
  }, [planSlug])

  const basePrice = plan
    ? period === 'annual' && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice
    : 0
  const discount = couponValid ? (basePrice * couponValid.discountPct) / 100 : 0
  const total = basePrice - discount

  async function validateCoupon() {
    if (!couponCode.trim()) return
    setValidatingCoupon(true)
    setCouponError('')
    setCouponValid(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setCouponValid({ discountPct: data.discountPct })
      } else {
        setCouponError(data.error || 'Invalid coupon code')
      }
    } catch {
      setCouponError('Failed to validate coupon')
    }
    setValidatingCoupon(false)
  }

  async function handleCheckout() {
    setProcessing(true)

    try {
      if (paymentMethod === 'stripe') {
        const res = await fetch('/api/payments/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug,
            period,
            couponCode: couponValid ? couponCode.trim().toUpperCase() : undefined,
          }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url // Redirect to Stripe Checkout
          return
        }
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (paymentMethod === 'paypal') {
        const res = await fetch('/api/payments/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planSlug, period, amount: total }),
        })
        const data = await res.json()
        if (data.approveUrl) {
          window.location.href = data.approveUrl
          return
        }
        throw new Error(data.error || 'Failed to create PayPal order')
      }

      if (paymentMethod === 'vnpay') {
        const res = await fetch('/api/payments/vnpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planSlug, period }),
        })
        const data = await res.json()
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
          return
        }
        throw new Error(data.error || 'Failed to create VNPay payment')
      }
    } catch (err: any) {
      alert(err.message)
    }
    setProcessing(false)
  }

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-6">
          <ArrowLeft size={12} /> Back to Pricing
        </Link>

        <h1 className="text-2xl font-bold text-text-primary mb-1">Complete Your Purchase</h1>
        <p className="text-sm text-text-secondary mb-8">You're subscribing to seeneyu {plan?.name} Plan</p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left: Payment */}
          <div className="md:col-span-3 space-y-6">
            {/* Payment Method */}
            <div className="bg-bg-surface border border-black/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Payment Method</h2>
              <div className="space-y-2">
                {[
                  { id: 'stripe' as const, label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Amex — powered by Stripe', icon: '💳' },
                  { id: 'paypal' as const, label: 'PayPal', desc: 'Pay with your PayPal account', icon: '🅿️' },
                  { id: 'vnpay' as const, label: 'VNPay', desc: 'Vietnamese bank transfer & e-wallets', icon: '🏦' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === method.id
                        ? 'border-accent-400 bg-accent-400/5'
                        : 'border-black/[0.06] hover:border-black/15'
                    }`}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{method.label}</p>
                      <p className="text-[10px] text-text-tertiary">{method.desc}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <CheckCircle size={16} className="text-accent-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-bg-surface border border-black/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Discount Code</h2>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponValid(null); setCouponError('') }}
                    placeholder="Enter code"
                    className="w-full bg-bg-inset border border-black/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-400/50 uppercase"
                  />
                </div>
                <button
                  onClick={validateCoupon}
                  disabled={!couponCode.trim() || validatingCoupon}
                  className="px-4 py-2.5 text-sm font-medium border border-black/10 rounded-lg text-text-secondary hover:text-text-primary hover:border-black/20 disabled:opacity-40 transition-colors"
                >
                  {validatingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponValid && (
                <div className="flex items-center gap-2 mt-2 text-emerald-400 text-xs">
                  <CheckCircle size={12} /> {couponValid.discountPct}% discount applied!
                  <button onClick={() => { setCouponValid(null); setCouponCode('') }} className="ml-auto text-text-muted hover:text-text-primary">
                    <X size={12} />
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
            </div>

            {/* Terms */}
            <p className="text-[10px] text-text-muted leading-relaxed">
              By completing this purchase you agree to our Terms of Service and Privacy Policy.
              {paymentMethod === 'stripe' && ' Your subscription will auto-renew. You can cancel anytime from your account settings.'}
              {paymentMethod !== 'stripe' && ' This is a one-time payment for the selected period. Renewal is manual.'}
              {' '}30-day money-back guarantee — no questions asked.
            </p>
          </div>

          {/* Right: Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-bg-surface border border-black/[0.06] rounded-2xl p-5 sticky top-8">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">seeneyu {plan?.name}</span>
                  <span className="text-text-primary font-medium">${basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-tertiary text-xs">
                  <span>Billing: {period === 'annual' ? 'Annual' : 'Monthly'}</span>
                  <span>{period === 'annual' ? '/year' : '/month'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({couponValid?.discountPct}%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-black/[0.06] pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-text-primary">Total</span>
                    <span className="text-lg font-bold text-text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing || total <= 0}
                className="w-full mt-5 bg-accent-400 text-bg-base font-semibold py-3.5 rounded-xl hover:bg-accent-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {processing ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard size={16} /> Complete Purchase</>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-[10px] text-text-muted">30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
