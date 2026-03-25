'use client'

export function BillingToggle({
  period,
  onChange,
}: {
  period: 'monthly' | 'annual'
  onChange: (p: 'monthly' | 'annual') => void
}) {
  return (
    <div className="inline-flex items-center p-1 rounded-pill bg-bg-surface border border-black/10">
      <button
        onClick={() => onChange('monthly')}
        className={`px-5 py-2 rounded-pill text-sm font-semibold transition-all duration-200 ${
          period === 'monthly'
            ? 'bg-bg-elevated text-text-primary shadow-sm'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange('annual')}
        className={`px-5 py-2 rounded-pill text-sm font-semibold transition-all duration-200 ${
          period === 'annual'
            ? 'bg-bg-elevated text-text-primary shadow-sm'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        Annual
        <span className="ml-1.5 text-xs font-bold text-success">Save 20%</span>
      </button>
    </div>
  )
}
