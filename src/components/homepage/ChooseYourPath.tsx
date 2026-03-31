'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

const PLANS = [
  {
    slug: 'basic',
    name: 'Basic',
    price: 'Free',
    priceNote: 'forever',
    benefits: [
      'Practice with beginner clips',
      'AI score on every attempt',
      'Track 5 core body language skills',
    ],
    cta: 'Get Started Free',
    href: '/auth/signin',
    highlight: false,
  },
  {
    slug: 'standard',
    name: 'Standard',
    price: '$12',
    priceNote: '/month',
    benefits: [
      'Land more job offers and promotions',
      'Full AI coaching with detailed feedback',
      'Unlimited intermediate + advanced clips',
    ],
    cta: 'Start 7-Day Free Trial',
    href: '/pricing',
    highlight: true,
  },
  {
    slug: 'advanced',
    name: 'Advanced',
    price: '$29',
    priceNote: '/month',
    benefits: [
      'VIP Masterclass — elite techniques',
      'Unlimited recordings + voice coaching',
      'Lead rooms like a TED speaker',
    ],
    cta: 'Start 7-Day Free Trial',
    href: '/pricing',
    highlight: false,
  },
]

export function ChooseYourPath() {
  return (
    <section className="py-20 px-4 bg-bg-base">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Choose Your Path
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Whether you're just starting out or ready to master elite communication — there's a plan for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.slug}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                plan.highlight
                  ? 'border-accent-400/40 bg-bg-elevated shadow-lg shadow-accent-400/10 scale-[1.02]'
                  : 'border-black/8 bg-bg-surface'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-pill bg-accent-400 text-text-inverse text-xs font-bold whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-3xl font-extrabold text-text-primary">{plan.price}</span>
                  <span className="text-sm text-text-tertiary mb-1">{plan.priceNote}</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-accent-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{b}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-3 rounded-pill text-sm font-semibold text-center transition-all duration-150 ${
                  plan.highlight
                    ? 'bg-accent-400 text-text-inverse hover:bg-accent-500 shadow-glow-sm'
                    : plan.slug === 'basic'
                    ? 'border border-black/15 text-text-secondary hover:text-text-primary hover:border-black/25'
                    : 'bg-text-primary text-bg-base hover:opacity-90'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-text-tertiary mt-8">
          No credit card required for free trial · Cancel anytime · 30-day money-back guarantee
        </p>
      </div>
    </section>
  )
}
