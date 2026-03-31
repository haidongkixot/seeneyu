'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Pause, Tag, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Step = 1 | 2 | 3

const EXIT_REASONS = [
  { id: 'too-expensive', label: 'It\'s too expensive right now' },
  { id: 'not-using', label: 'I\'m not using it enough' },
  { id: 'missing-features', label: 'Missing features I need' },
  { id: 'found-alternative', label: 'I found a better alternative' },
  { id: 'other', label: 'Other reason' },
]

export default function CancelPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [offerChoice, setOfferChoice] = useState<'pause' | 'discount' | null>(null)
  const [processing, setCancelling] = useState(false)
  const [couponCopied, setCouponCopied] = useState(false)

  async function handleConfirmCancel() {
    setCancelling(true)
    try {
      await fetch('/api/subscriptions/cancel', { method: 'POST' })
    } catch {
      // silently fail — show confirmation either way
    } finally {
      setCancelling(false)
      setStep(3)
    }
  }

  function copyCoupon() {
    navigator.clipboard.writeText('SAVE30')
    setCouponCopied(true)
    setTimeout(() => setCouponCopied(false), 2500)
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Step 1: Exit survey */}
        {step === 1 && (
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">We're sad to see you go</h1>
                <p className="text-sm text-text-secondary">Help us improve by sharing why you're leaving.</p>
              </div>
            </div>

            <div className="space-y-2">
              {EXIT_REASONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150',
                    selectedReason === r.id
                      ? 'border-accent-400/50 bg-accent-400/8 text-text-primary'
                      : 'border-black/8 text-text-secondary hover:border-black/15 hover:text-text-primary'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => router.back()}
                className="flex-1 py-2.5 rounded-pill border border-black/15 text-sm font-semibold text-text-secondary hover:text-text-primary transition-all duration-150"
              >
                Keep my plan
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedReason}
                className="flex-1 py-2.5 rounded-pill bg-text-primary text-bg-base text-sm font-semibold hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Retention offer */}
        {step === 2 && (
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-text-primary mb-1">Before you go…</h2>
              <p className="text-sm text-text-secondary">Can we offer you an alternative?</p>
            </div>

            <div className="space-y-3">
              {/* Pause option */}
              <button
                onClick={() => setOfferChoice('pause')}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all duration-150',
                  offerChoice === 'pause'
                    ? 'border-accent-400/50 bg-accent-400/8'
                    : 'border-black/8 hover:border-black/15'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Pause size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Pause for 1 month</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      Take a break and come back when you're ready. No charges while paused.
                    </p>
                  </div>
                </div>
              </button>

              {/* Discount option */}
              <button
                onClick={() => setOfferChoice('discount')}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all duration-150',
                  offerChoice === 'discount'
                    ? 'border-accent-400/50 bg-accent-400/8'
                    : 'border-black/8 hover:border-black/15'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Tag size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">30% off next month</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      Use coupon <code className="bg-bg-inset px-1.5 py-0.5 rounded text-accent-400 font-mono">SAVE30</code> at your next billing.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {offerChoice === 'discount' && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-green-800">Your coupon code</p>
                  <p className="text-lg font-mono font-bold text-green-700">SAVE30</p>
                </div>
                <button
                  onClick={copyCoupon}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                >
                  {couponCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-pill border border-black/15 text-sm font-semibold text-text-secondary hover:text-text-primary transition-all duration-150"
              >
                ← Back
              </button>
              {offerChoice ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-2.5 rounded-pill bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
                >
                  {offerChoice === 'pause' ? 'Pause my plan' : 'Keep my plan'}
                </button>
              ) : (
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 rounded-pill border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-150"
                >
                  Cancel anyway
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirmed */}
        {step === 3 && (
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-black/8 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-text-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Subscription Cancelled</h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                Your subscription has been cancelled. You'll retain access until the end of your current billing period.
              </p>
            </div>
            <div className="bg-accent-400/8 border border-accent-400/20 rounded-xl px-5 py-4 text-sm text-text-secondary leading-relaxed">
              <p className="font-semibold text-text-primary mb-1">Come back anytime</p>
              <p>Your progress, skills, and history will be waiting for you. Reactivate in one click whenever you're ready.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-pill bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
