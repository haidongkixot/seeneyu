'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BillingToggle } from '@/components/pricing/BillingToggle'
import { PlanCard } from '@/components/pricing/PlanCard'
import { ComparisonTable } from '@/components/pricing/ComparisonTable'
import { PaymentMethodSelector } from '@/components/pricing/PaymentMethodSelector'
import { CheckCircle2, Shield, Star, Quote, ChevronDown, ChevronUp } from 'lucide-react'

interface PlanInfo {
  slug: string
  name: string
  tagline: string | null
  monthlyPrice: number
  annualPrice: number | null
  features: string[]
}

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Product Manager at Stripe',
    text: 'After 3 weeks on Standard, I landed a promotion I had been working toward for two years. The eye-contact drills alone changed how my team perceives me.',
    plan: 'Standard',
    avatar: 'SM',
  },
  {
    name: 'James T.',
    role: 'Sales Lead, Melbourne',
    text: 'I closed 40% more deals last quarter. My posture and vocal pacing were holding me back — seeneyu showed me exactly where to improve.',
    plan: 'Advanced',
    avatar: 'JT',
  },
  {
    name: 'Priya K.',
    role: 'University Student',
    text: "I started on Basic to see if it would help with job interviews. Within a week I upgraded. The AI feedback is incredibly specific — not generic advice.",
    plan: 'Standard',
    avatar: 'PK',
  },
]

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel with one click from your account settings. No questions asked, no hidden fees. Your access continues until the end of your billing period.',
  },
  {
    q: 'How does the 7-day free trial work?',
    a: "Start your trial today with no credit card required. You get full Standard plan access for 7 days. At the end, you can upgrade or you'll automatically drop to the free Basic plan.",
  },
  {
    q: 'What makes Advanced different from Standard?',
    a: 'Advanced unlocks the VIP Masterclass library (elite techniques used by TED speakers and executives), unlimited AI coaching sessions, 3-minute recordings, and a dedicated Coach Ney voice companion.',
  },
  {
    q: 'Is seeneyu suitable for complete beginners?',
    a: 'Absolutely. The onboarding assessment places you at the right level for all 5 skill tracks. Most users see meaningful improvement in 2–4 weeks of consistent daily practice.',
  },
  {
    q: 'Do you offer team or corporate plans?',
    a: "Yes — we offer Team Plans starting at $8/seat for 5+ seats, with a central admin dashboard to track your team's progress. Contact us or visit the Teams page to learn more.",
  },
]

const OUTCOME_COPY: Record<string, { outcomes: string[]; cta: string }> = {
  basic: {
    outcomes: [
      'Learn the 5 core body language signals',
      'Practice with beginner clips',
      'Track your improvement over time',
    ],
    cta: 'Start for Free',
  },
  standard: {
    outcomes: [
      'Land more job offers and promotions',
      'Command attention in every meeting',
      'Build unshakeable confidence in social settings',
    ],
    cta: 'Start 7-Day Free Trial',
  },
  advanced: {
    outcomes: [
      'Master elite communication techniques',
      'Speak like a TED Talk presenter',
      'Lead rooms, close deals, build authority',
    ],
    cta: 'Start 7-Day Free Trial',
  },
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-black/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-text-primary font-medium hover:bg-bg-surface transition-colors"
      >
        <span>{q}</span>
        {open ? <ChevronUp size={16} className="text-text-secondary shrink-0" /> : <ChevronDown size={16} className="text-text-secondary shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-text-secondary leading-relaxed border-t border-black/8 pt-3">
          {a}
        </div>
      )}
    </div>
  )
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
  const [trialStarting, setTrialStarting] = useState(false)

  const userPlan = (session?.user as any)?.plan || 'basic'

  useEffect(() => {
    fetch('/api/public/plans')
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
      router.push('/auth/signin?redirect=/pricing')
      return
    }
    if (slug === 'basic' || slug === userPlan) return
    setSelectedPlan(slug)
  }

  async function handleStartTrial(slug: string) {
    if (!session) {
      router.push('/auth/signin?redirect=/pricing')
      return
    }
    setTrialStarting(true)
    try {
      const res = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard?welcome=trial')
    } catch (err: any) {
      alert(err.message || 'Could not start trial. Please try again.')
    } finally {
      setTrialStarting(false)
    }
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
        body: JSON.stringify({ planSlug: selectedPlan, period, amount: price }),
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
      <main className="max-w-6xl mx-auto px-4 lg:px-8 pt-14 pb-24">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-accent-400/10 border border-accent-400/20 text-accent-400 text-xs font-semibold mb-5">
            <Star size={12} fill="currentColor" /> 7-day free trial on all paid plans
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4 leading-tight">
            Choose Your Path to<br className="hidden md:block" /> Confident Communication
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Whether you want to nail interviews, lead meetings, or command any room — there is a plan built for your goal.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>

        {/* Plan cards — outcome-focused */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-bg-surface animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {plans.map(plan => {
              const copy = OUTCOME_COPY[plan.slug] ?? { outcomes: plan.features?.slice(0, 3) ?? [], cta: 'Get Started' }
              const isPopular = plan.slug === 'standard'
              const isCurrent = plan.slug === userPlan
              const isPaid = plan.slug !== 'basic'
              const price = period === 'annual' && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice

              return (
                <div
                  key={plan.slug}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                    isPopular
                      ? 'border-accent-400/40 bg-bg-elevated shadow-lg shadow-accent-400/10 scale-[1.02]'
                      : 'border-black/8 bg-bg-surface hover:border-black/15'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-pill bg-accent-400 text-text-inverse text-xs font-bold whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-text-primary capitalize">{plan.name}</h3>
                    {plan.tagline && <p className="text-sm text-text-secondary mt-1">{plan.tagline}</p>}
                    <div className="mt-4 flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-text-primary">
                        {price === 0 ? 'Free' : `$${price}`}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-text-tertiary mb-1.5">
                          /{period === 'annual' ? 'mo, billed annually' : 'mo'}
                        </span>
                      )}
                    </div>
                    {period === 'annual' && plan.annualPrice && (
                      <p className="text-xs text-accent-400 font-medium mt-1">
                        Save {Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100)}% vs monthly
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {copy.outcomes.map((o, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-accent-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-text-secondary">{o}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="w-full py-3 rounded-pill border border-accent-400/30 text-sm font-semibold text-accent-400 text-center bg-accent-400/5">
                      Current Plan
                    </div>
                  ) : plan.slug === 'basic' ? (
                    <button
                      onClick={() => handleSelectPlan(plan.slug)}
                      className="w-full py-3 rounded-pill border border-black/15 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-black/25 transition-all duration-150"
                    >
                      {copy.cta}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTrial(plan.slug)}
                      disabled={trialStarting}
                      className={`w-full py-3 rounded-pill text-sm font-semibold transition-all duration-150 disabled:opacity-50 ${
                        isPopular
                          ? 'bg-accent-400 text-text-inverse hover:bg-accent-500 shadow-glow-sm'
                          : 'bg-text-primary text-bg-base hover:opacity-90'
                      }`}
                    >
                      {trialStarting ? 'Starting trial…' : copy.cta}
                    </button>
                  )}

                  {isPaid && !isCurrent && (
                    <a
                      href={`/checkout?plan=${plan.slug}&period=${period}`}
                      className="text-xs text-text-tertiary hover:text-text-secondary transition-colors text-center mt-3 block"
                    >
                      Or pay now →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Money-back guarantee */}
        <div className="flex items-center justify-center gap-2 text-sm text-text-secondary mb-14">
          <Shield size={16} className="text-accent-400" />
          <span>30-day money-back guarantee — no questions asked.</span>
        </div>

        {/* Comparison table */}
        <ComparisonTable />

        {/* Testimonials */}
        <div className="mt-20 mb-16">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-10">
            Real results from real learners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-bg-surface border border-black/8 rounded-2xl p-6 flex flex-col gap-4">
                <Quote size={20} className="text-accent-400/50" />
                <p className="text-sm text-text-secondary leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-black/8">
                  <div className="w-9 h-9 rounded-full bg-accent-400/15 flex items-center justify-center text-accent-400 text-xs font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-tertiary">{t.role}</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-pill bg-accent-400/10 text-accent-400 font-medium capitalize">
                    {t.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>

        {/* Payment modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-bg-elevated border border-black/8 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
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
                  className="flex-1 px-4 py-3 rounded-pill border border-black/15 text-sm font-semibold text-text-secondary hover:text-text-primary transition-all duration-150"
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
      </main>
    </div>
  )
}
