'use client'

import { Check } from 'lucide-react'

interface PlanInfo {
  slug: string
  name: string
  tagline: string | null
  monthlyPrice: number
  annualPrice: number | null
  features: string[]
}

export function PlanCard({
  plan,
  isPopular,
  isCurrentPlan,
  period,
  onSelect,
}: {
  plan: PlanInfo
  isPopular: boolean
  isCurrentPlan: boolean
  period: 'monthly' | 'annual'
  onSelect: () => void
}) {
  const price = period === 'annual' && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice

  return (
    <div className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-200 ${
      isPopular
        ? 'bg-bg-surface border-accent-400/40 shadow-glow ring-1 ring-accent-400/20'
        : 'bg-bg-surface border-white/8 shadow-card'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-pill bg-accent-400 text-text-inverse text-xs font-bold uppercase tracking-wider shadow-glow-sm">
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-lg font-bold text-text-primary mb-1">{plan.name}</h3>
      {plan.tagline && <p className="text-sm text-text-secondary mb-4">{plan.tagline}</p>}

      <div className="mb-6">
        {plan.monthlyPrice === 0 ? (
          <span className="text-4xl font-extrabold text-text-primary">Free</span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-text-primary">${price}</span>
            <span className="text-sm text-text-tertiary">/mo</span>
          </div>
        )}
        {period === 'annual' && plan.monthlyPrice > 0 && plan.annualPrice && (
          <p className="text-xs text-text-tertiary mt-1">
            Billed ${(plan.annualPrice * 12).toFixed(2)}/year
          </p>
        )}
      </div>

      <ul className="flex-1 flex flex-col gap-2.5 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
            <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <div className="px-6 py-3 rounded-pill border border-white/15 text-center text-sm font-semibold text-text-tertiary">
          Current Plan
        </div>
      ) : (
        <button
          onClick={onSelect}
          className={`px-6 py-3 rounded-pill font-semibold text-sm text-center transition-all duration-150 ${
            isPopular
              ? 'bg-accent-400 text-text-inverse hover:bg-accent-500 shadow-glow-sm'
              : 'border border-white/15 text-text-primary hover:border-accent-400/30 hover:bg-bg-overlay'
          }`}
        >
          {plan.monthlyPrice === 0 ? 'Get Started' : 'Upgrade'}
        </button>
      )}
    </div>
  )
}
