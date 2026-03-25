# M25 — Subscription + Payment Spec
> Designer: M25 delivery
> Date: 2026-03-25
> Status: READY FOR IMPLEMENTATION

---

## Overview

Three subscription tiers: Basic (free), Standard, Advanced. Public pricing page with plan comparison. PayPal + VNPay payment integration. Admin plan management. In-app upgrade prompts.

**Design language**: Clean, trust-building. Pricing cards are the most important conversion surface — high contrast, clear hierarchy, prominent CTA on recommended plan.

---

## Plan Tiers

| Feature | Basic (Free) | Standard | Advanced |
|---|---|---|---|
| Price | $0/mo | $9.99/mo | $24.99/mo |
| Annual | — | $7.99/mo (billed $95.88) | $19.99/mo (billed $239.88) |
| Video recording length | 5 seconds | 30 seconds | 3 minutes |
| AI feedback | Short summary | Full analysis | Full + monthly coach summary |
| Arcade challenges | 3 per type | Unlimited | Unlimited |
| Practice sessions | Limited | Unlimited | Unlimited |
| VIP lessons | No | No | Yes |
| Priority support | No | No | Yes |

---

## Screen 1: `/pricing` — Public Pricing Page

### Header

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│              Choose Your Plan                                        │
│              Start free. Upgrade when you're ready.                   │
│                                                                      │
│              [ Monthly ]  [ Annual — Save 20% ]                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

```tsx
<div className="text-center mb-10">
  <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-3">
    Choose Your Plan
  </h1>
  <p className="text-lg text-text-secondary mb-6">
    Start free. Upgrade when you're ready.
  </p>

  {/* Billing toggle */}
  <BillingToggle period={period} onChange={setPeriod} />
</div>
```

### BillingToggle

```tsx
function BillingToggle({
  period,
  onChange,
}: {
  period: 'monthly' | 'annual'
  onChange: (p: 'monthly' | 'annual') => void
}) {
  return (
    <div className="inline-flex items-center p-1 rounded-pill bg-bg-surface border border-white/10">
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
```

---

### Plan Cards Grid

```
┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────┐
│  Basic           │  │  ★ MOST POPULAR      │  │  Advanced        │
│                  │  │  Standard             │  │                  │
│  Free            │  │                      │  │  $24.99/mo       │
│                  │  │  $9.99/mo             │  │                  │
│  ✓ 5s recording  │  │                      │  │  ✓ 3 min record  │
│  ✓ Short feedback│  │  ✓ 30s recording     │  │  ✓ Full + coach  │
│  ✓ 3 challenges  │  │  ✓ Full AI feedback  │  │  ✓ VIP lessons   │
│  ✓ Library browse│  │  ✓ Unlimited arcade  │  │  ✓ Priority help │
│                  │  │  ✓ Unlimited practice│  │  ✓ Everything in  │
│  [Current Plan]  │  │                      │  │    Standard      │
│                  │  │  [Upgrade →]         │  │                  │
│                  │  │                      │  │  [Upgrade →]     │
└─────────────────┘  └─────────────────────┘  └─────────────────┘
```

### PlanCard Component

```tsx
function PlanCard({
  plan,
  isPopular,
  isCurrentPlan,
  period,
  onSelect,
}: {
  plan: Plan
  isPopular: boolean
  isCurrentPlan: boolean
  period: 'monthly' | 'annual'
  onSelect: () => void
}) {
  const price = period === 'annual' ? plan.annualPrice : plan.monthlyPrice

  return (
    <div className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-200
                    ${isPopular
                      ? 'bg-bg-surface border-accent-400/40 shadow-glow ring-1 ring-accent-400/20'
                      : 'bg-bg-surface border-white/8 shadow-card'
                    }`}>

      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-pill bg-accent-400 text-text-inverse
                          text-xs font-bold uppercase tracking-wider shadow-glow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-lg font-bold text-text-primary mb-1">{plan.name}</h3>
      <p className="text-sm text-text-secondary mb-4">{plan.tagline}</p>

      {/* Price */}
      <div className="mb-6">
        {plan.price === 0 ? (
          <span className="text-4xl font-extrabold text-text-primary">Free</span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-text-primary">
              ${price}
            </span>
            <span className="text-sm text-text-tertiary">/mo</span>
          </div>
        )}
        {period === 'annual' && plan.price > 0 && (
          <p className="text-xs text-text-tertiary mt-1">
            Billed ${(price * 12).toFixed(2)}/year
          </p>
        )}
      </div>

      {/* Feature list */}
      <ul className="flex-1 flex flex-col gap-2.5 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
            <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrentPlan ? (
        <div className="px-6 py-3 rounded-pill border border-white/15 text-center
                       text-sm font-semibold text-text-tertiary">
          Current Plan
        </div>
      ) : (
        <button
          onClick={onSelect}
          className={`px-6 py-3 rounded-pill font-semibold text-sm text-center
                     transition-all duration-150 ${
            isPopular
              ? 'bg-accent-400 text-text-inverse hover:bg-accent-500 shadow-glow-sm'
              : 'border border-white/15 text-text-primary hover:border-accent-400/30 hover:bg-bg-overlay'
          }`}
        >
          {plan.price === 0 ? 'Get Started' : 'Upgrade'}
        </button>
      )}
    </div>
  )
}
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
  {plans.map(plan => (
    <PlanCard
      key={plan.id}
      plan={plan}
      isPopular={plan.slug === 'standard'}
      isCurrentPlan={currentPlan?.slug === plan.slug}
      period={period}
      onSelect={() => handleSelect(plan)}
    />
  ))}
</div>
```

---

### Feature Comparison Table (below cards)

```tsx
<div className="mt-16 max-w-4xl mx-auto">
  <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
    Compare Plans
  </h2>
  <div className="rounded-2xl border border-white/8 overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-bg-surface border-b border-white/8">
          <th className="text-left py-4 px-6 text-text-secondary font-medium">Feature</th>
          <th className="text-center py-4 px-4 text-text-primary font-semibold">Basic</th>
          <th className="text-center py-4 px-4 text-text-primary font-semibold
                         bg-accent-400/5 border-x border-accent-400/10">Standard</th>
          <th className="text-center py-4 px-4 text-text-primary font-semibold">Advanced</th>
        </tr>
      </thead>
      <tbody>
        {comparisonRows.map((row, i) => (
          <tr key={i} className="border-b border-white/6 last:border-0">
            <td className="py-3 px-6 text-text-secondary">{row.feature}</td>
            <td className="py-3 px-4 text-center">{renderValue(row.basic)}</td>
            <td className="py-3 px-4 text-center bg-accent-400/5 border-x border-accent-400/10">
              {renderValue(row.standard)}
            </td>
            <td className="py-3 px-4 text-center">{renderValue(row.advanced)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**renderValue helper**:
```tsx
function renderValue(val: string | boolean) {
  if (val === true) return <Check size={16} className="text-success mx-auto" />
  if (val === false) return <X size={16} className="text-text-tertiary mx-auto" />
  return <span className="text-text-primary text-sm">{val}</span>
}
```

---

## Component: PlanBadge

Small pill shown in NavBar, profile, or dashboard to indicate current plan.

```tsx
function PlanBadge({ plan }: { plan: 'basic' | 'standard' | 'advanced' }) {
  const config = {
    basic: {
      label: 'Free',
      classes: 'bg-white/5 text-text-tertiary border-white/10',
    },
    standard: {
      label: 'Standard',
      classes: 'bg-accent-400/10 text-accent-400 border-accent-400/25',
    },
    advanced: {
      label: 'Advanced',
      classes: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
    },
  }[plan]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill
                     text-xs font-semibold border ${config.classes}`}>
      {plan === 'advanced' && <Crown size={10} />}
      {config.label}
    </span>
  )
}
```

---

## Component: UpgradePrompt

Shown inline when a user hits a plan limit (e.g., 5s video cap on Basic, 3 challenge limit).

```
┌──────────────────────────────────────────────────────────────┐
│  ⚡ Unlock longer recordings                                 │
│  Upgrade to Standard for 30s video and full AI feedback.     │
│                                      [ See Plans → ]         │
└──────────────────────────────────────────────────────────────┘
```

```tsx
function UpgradePrompt({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl
                    bg-accent-400/5 border border-accent-400/15">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-400/10
                      flex items-center justify-center mt-0.5">
        <Zap size={16} className="text-accent-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary mb-0.5">{title}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      <Link
        href="/pricing"
        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-pill
                   text-xs font-semibold text-accent-400
                   border border-accent-400/25 hover:bg-accent-400/10
                   transition-all duration-150">
        See Plans
        <ArrowRight size={12} />
      </Link>
    </div>
  )
}
```

---

## Screen 2: Payment Flow (Checkout)

After user clicks "Upgrade" on a plan:

### Step 1: Payment Method Selection

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Upgrade to Standard                                         │
│  $9.99/month                                                 │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐              │
│  │  PayPal             │  │  VNPay              │             │
│  │  [PayPal logo]      │  │  [VNPay logo]       │             │
│  │  ○ selected         │  │  ○                  │             │
│  └────────────────────┘  └────────────────────┘              │
│                                                              │
│  [ Continue to Payment → ]                                   │
│                                                              │
│  🔒 Secure payment. Cancel anytime.                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

```tsx
function PaymentMethodSelector({
  selectedMethod,
  onChange,
}: {
  selectedMethod: 'paypal' | 'vnpay'
  onChange: (m: 'paypal' | 'vnpay') => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['paypal', 'vnpay'] as const).map(method => (
        <button
          key={method}
          onClick={() => onChange(method)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border
                     transition-all duration-200 ${
            selectedMethod === method
              ? 'border-accent-400/40 bg-accent-400/5 shadow-glow-sm'
              : 'border-white/10 bg-bg-surface hover:border-white/20'
          }`}
        >
          <span className="text-2xl">
            {method === 'paypal' ? '🅿️' : '💳'}
          </span>
          <span className="text-sm font-semibold text-text-primary capitalize">
            {method === 'paypal' ? 'PayPal' : 'VNPay'}
          </span>
          {/* Radio dot */}
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            selectedMethod === method
              ? 'border-accent-400'
              : 'border-white/20'
          }`}>
            {selectedMethod === method && (
              <div className="w-2 h-2 rounded-full bg-accent-400" />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
```

### Security Footer

```tsx
<div className="flex items-center gap-2 justify-center mt-4 text-xs text-text-tertiary">
  <ShieldCheck size={14} />
  <span>Secure payment. Cancel anytime.</span>
</div>
```

After clicking "Continue to Payment" — redirect to PayPal or VNPay hosted checkout (external). On return, land on `/payment/success`.

---

## Screen 3: `/payment/success` — Payment Confirmation

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    ✓                                         │
│                                                              │
│          Welcome to Standard!                                │
│          Your subscription is now active.                     │
│                                                              │
│          ┌──────────────────────────────────┐                │
│          │  Recording limit: 30 seconds      │               │
│          │  AI feedback: Full analysis        │               │
│          │  Arcade: Unlimited challenges      │               │
│          │  Practice: Unlimited sessions      │               │
│          └──────────────────────────────────┘                │
│                                                              │
│          [ Start Practicing → ]                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

```tsx
function PaymentSuccess({ plan }: { plan: Plan }) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20
                        flex items-center justify-center mx-auto mb-6
                        animate-[pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
          <CheckCircle size={32} className="text-success" />
        </div>

        <h1 className="text-2xl font-extrabold text-text-primary mb-2">
          Welcome to {plan.name}!
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Your subscription is now active.
        </p>

        {/* Perks list */}
        <div className="rounded-xl bg-bg-surface border border-white/8 p-5 mb-8 text-left">
          <ul className="flex flex-col gap-3">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-text-primary">
                <Check size={16} className="text-success flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/library"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-pill
                     bg-accent-400 text-text-inverse font-semibold text-base
                     hover:bg-accent-500 shadow-glow-sm transition-all duration-150">
          Start Practicing
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
```

---

## Screen 4: `/admin/plans` — Admin Plan Management

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Subscription Plans                        [ + Add Plan ]     │
├──────────────────────────────────────────────────────────────┤
│  Name         Slug       Monthly   Annual   Subscribers  Act  │
│  ──────────────────────────────────────────────────────────   │
│  Basic        basic      Free      —        142          [✎]  │
│  Standard     standard   $9.99     $7.99    38           [✎]  │
│  Advanced     advanced   $24.99    $19.99   12           [✎]  │
└──────────────────────────────────────────────────────────────┘
```

Standard admin table using existing admin design patterns (from M8 Admin CMS):

```tsx
// Table row
<tr className="border-b border-white/6 hover:bg-bg-overlay/30 transition-colors">
  <td className="py-3 px-4">
    <div className="flex items-center gap-2">
      <PlanBadge plan={plan.slug} />
      <span className="text-sm font-medium text-text-primary">{plan.name}</span>
    </div>
  </td>
  <td className="py-3 px-4 text-sm text-text-secondary font-mono">{plan.slug}</td>
  <td className="py-3 px-4 text-sm text-text-primary">
    {plan.monthlyPrice === 0 ? 'Free' : `$${plan.monthlyPrice}`}
  </td>
  <td className="py-3 px-4 text-sm text-text-primary">
    {plan.annualPrice ? `$${plan.annualPrice}` : '—'}
  </td>
  <td className="py-3 px-4 text-sm text-text-secondary">{plan.subscriberCount}</td>
  <td className="py-3 px-4">
    <button className="p-1.5 rounded-lg text-text-tertiary
                       hover:text-text-primary hover:bg-bg-overlay transition-colors">
      <Pencil size={14} />
    </button>
  </td>
</tr>
```

### Plan Edit Modal

Standard admin modal (rounded-2xl, bg-bg-elevated, border-white/10). Fields:
- Name (text input)
- Slug (text, read-only for existing)
- Monthly Price (number input, $ prefix)
- Annual Price (number input, $ prefix)
- Features (textarea, one per line)
- Video Limit (seconds, number input)
- Is Active (toggle switch)

---

## Mobile Behavior

| Screen | Mobile |
|---|---|
| Pricing page | Single-column cards, stacked. Popular plan first (reorder via CSS `order`). |
| BillingToggle | Full-width |
| Comparison table | Horizontal scroll with sticky first column |
| Payment method | Full-width cards stacked |
| Payment success | Centered, full-width card |
| Admin plans | Standard admin responsive table (horizontal scroll on mobile) |

---

## NavBar Addition

Add "Pricing" link to the public navigation (shown when not on `/admin`):

```tsx
<Link
  href="/pricing"
  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
>
  Pricing
</Link>
```

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/app/pricing/page.tsx` | **NEW** — public pricing page |
| `src/app/payment/success/page.tsx` | **NEW** — payment confirmation |
| `src/app/admin/plans/page.tsx` | **NEW** — admin plan management |
| `src/components/pricing/PlanCard.tsx` | **NEW** |
| `src/components/pricing/BillingToggle.tsx` | **NEW** |
| `src/components/pricing/ComparisonTable.tsx` | **NEW** |
| `src/components/pricing/PaymentMethodSelector.tsx` | **NEW** |
| `src/components/PlanBadge.tsx` | **NEW** |
| `src/components/UpgradePrompt.tsx` | **NEW** |
| `src/components/NavBar.tsx` | **MODIFY** — add Pricing link + PlanBadge |
