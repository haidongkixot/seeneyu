'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/NavBar'
import { BillingToggle } from '@/components/pricing/BillingToggle'
import { PlanCard } from '@/components/pricing/PlanCard'
import { ComparisonTable } from '@/components/pricing/ComparisonTable'
import { PaymentMethodSelector } from '@/components/pricing/PaymentMethodSelector'

interface PlanInfo {
  slug: string
  name: string
  tagline: string | null
  monthlyPrice: number
  annualPrice: number | null
  features: string[]
}

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'vnpay'>('paypal')
  const [processing, setProcessing] = useState(false)

  const userPlan = (session?.user as any)?.plan || 'basic'

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(r => r.json())
      .then(data => {
        const active = (data as PlanInfo[]).filter((p: any) => p.isActive !== false)
        setPlans(active)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSelectPlan(slug: string) {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (slug === 'basic' || slug === userPlan) return
    setSelectedPlan(slug)
  }

  async function handleCheckout() {
    if (!selectedPlan || processing) return
    setProcessing(true)

    try {
      const plan = plans.find(p => p.slug === selectedPlan)
      if (!plan) return

      const price = period === 'annual' && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice
      const endpoint = paymentMethod === 'paypal' ? '/api/payments/paypal' : '/api/payments/vnpay'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: selectedPlan,
          period,
          amount: price,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.approvalUrl || data.paymentUrl) {
        window.location.href = data.approvalUrl || data.paymentUrl
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 lg:px-8 pt-12 pb-20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-text-primary mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Unlock longer recordings, detailed AI coaching, and VIP content to accelerate your communication skills.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>

        {/* Plan cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 skeleton rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                isPopular={plan.slug === 'standard'}
                isCurrentPlan={plan.slug === userPlan}
                period={period}
                onSelect={() => handleSelectPlan(plan.slug)}
              />
            ))}
          </div>
        )}

        {/* Payment modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-bg-elevated border border-white/8 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold text-text-primary mb-1">
                Upgrade to {plans.find(p => p.slug === selectedPlan)?.name}
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                Select your preferred payment method
              </p>

              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onChange={setPaymentMethod}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 px-4 py-3 rounded-pill border border-white/15 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-white/25 transition-all duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="flex-1 px-4 py-3 rounded-pill bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 shadow-glow-sm transition-all duration-150 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comparison table */}
        <ComparisonTable />
      </main>
    </div>
  )
}
