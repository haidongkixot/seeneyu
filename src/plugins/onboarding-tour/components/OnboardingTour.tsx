'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useTourConfig } from '../hooks/useTourConfig'
import { useElementHighlight } from '../hooks/useElementHighlight'
import type { TourPhase } from '../types'
import { X, ChevronLeft, ChevronRight, Sparkles, Award } from 'lucide-react'

export function OnboardingTour() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { config, loading: configLoading } = useTourConfig()

  const [phase, setPhase] = useState<TourPhase>('idle')
  const [slideIdx, setSlideIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [tourCompleted, setTourCompleted] = useState<boolean | null>(null)
  const [xpAwarded, setXpAwarded] = useState(0)

  // Check if user needs tour
  useEffect(() => {
    if (!session) return
    fetch('/api/onboarding-tour/status')
      .then((r) => r.json())
      .then((d) => setTourCompleted(d.tourCompleted))
      .catch(() => setTourCompleted(true))
  }, [session])

  // Auto-start tour for new users
  useEffect(() => {
    if (tourCompleted === false && config?.enabled && phase === 'idle') {
      // Small delay to let the page render
      const t = setTimeout(() => setPhase('slideshow'), 1500)
      return () => clearTimeout(t)
    }
  }, [tourCompleted, config, phase])

  const sortedSteps = config?.steps?.slice().sort((a, b) => a.order - b.order) ?? []
  const currentStep = sortedSteps[stepIdx] ?? null
  const targetRect = useElementHighlight(phase === 'guided' ? currentStep?.targetSelector ?? null : null)

  function advanceStep() {
    const isLast = stepIdx >= sortedSteps.length - 1
    if (isLast) {
      completeTour(false)
      return
    }
    const next = sortedSteps[stepIdx + 1]
    // Navigate before incrementing so the target page loads while next step renders
    if (currentStep?.action === 'navigate' && currentStep?.actionUrl) {
      router.push(currentStep.actionUrl)
    } else if (next?.page && !pathname?.startsWith(next.page)) {
      router.push(next.page)
    }
    setStepIdx((p) => p + 1)
  }

  async function completeTour(skipped: boolean) {
    setPhase('completing')
    try {
      const res = await fetch('/api/onboarding-tour/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped }),
      })
      const data = await res.json()
      setXpAwarded(data.xpAwarded ?? 0)
    } catch { /* ignore */ }
    if (skipped) {
      setPhase('idle')
      setTourCompleted(true)
    } else {
      setPhase('done')
    }
  }

  function dismiss() {
    setPhase('idle')
    setTourCompleted(true)
  }

  // Don't render anything if not needed
  if (!session || tourCompleted !== false || !config?.enabled || phase === 'idle') return null

  const slides = config.slides?.slice().sort((a, b) => a.order - b.order) ?? []
  const steps = sortedSteps

  // ── Intro Slideshow ─────────────────────────────────────────
  if (phase === 'slideshow') {
    const slide = slides[slideIdx]
    if (!slide) { setPhase('guided'); return null }

    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <button onClick={() => completeTour(true)} className="absolute top-4 right-4 text-white/50 hover:text-white text-sm flex items-center gap-1 z-10">
          <X size={16} /> Skip
        </button>

        <div className="max-w-lg w-full text-center">
          {slide.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.imageUrl} alt={slide.title} className="w-full max-h-64 object-contain rounded-2xl mb-6" />
          )}
          <h2 className="text-2xl font-bold text-white mb-3">{slide.title}</h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">{slide.description}</p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {slides.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? 'bg-amber-400 w-6' : 'bg-white/20'}`} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            {slideIdx > 0 && (
              <button onClick={() => setSlideIdx((p) => p - 1)} className="flex items-center gap-1 text-white/50 hover:text-white text-sm px-4 py-2">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button
              onClick={() => {
                if (slideIdx < slides.length - 1) setSlideIdx((p) => p + 1)
                else { setStepIdx(0); setPhase('guided') }
              }}
              className="bg-amber-400 text-black font-semibold px-8 py-3 rounded-xl hover:bg-amber-300 transition-colors text-sm"
            >
              {slideIdx < slides.length - 1 ? 'Next' : "Let's Go!"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Guided Tour (Spotlight + Tooltip) ───────────────────────
  if (phase === 'guided' && currentStep) {
    const isLast = stepIdx >= steps.length - 1
    const isNavigateStep = currentStep.action === 'navigate'
    const pad = 8

    return (
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* Visual highlight only — NO dark overlay, NO click blocking.
            We just draw a glowing border around the target so users can
            still interact with the page normally. */}
        {targetRect && (
          <div
            className="absolute pointer-events-none transition-all duration-200"
            style={{
              top: targetRect.top - window.scrollY - pad,
              left: targetRect.left - pad,
              width: targetRect.width + pad * 2,
              height: targetRect.height + pad * 2,
              borderRadius: 12,
              boxShadow: '0 0 0 3px rgba(251, 191, 36, 0.9), 0 0 0 9999px rgba(0, 0, 0, 0.35)',
              animation: 'tour-pulse 2s ease-in-out infinite',
            }}
          />
        )}
        <style jsx>{`
          @keyframes tour-pulse {
            0%, 100% { box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.9), 0 0 0 9999px rgba(0, 0, 0, 0.35); }
            50% { box-shadow: 0 0 0 3px rgba(251, 191, 36, 1), 0 0 12px 3px rgba(251, 191, 36, 0.6), 0 0 0 9999px rgba(0, 0, 0, 0.35); }
          }
        `}</style>

        {/* Tooltip */}
        {targetRect && (
          <div
            className="absolute pointer-events-auto"
            style={{
              top: targetRect.top - window.scrollY + targetRect.height + pad + 12,
              left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 340)),
              width: 320,
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl p-5 border border-black/10">
              {currentStep.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentStep.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <h3 className="text-sm font-bold text-gray-900 mb-1">{currentStep.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{currentStep.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Step {stepIdx + 1} of {steps.length}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => completeTour(true)}
                    className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1"
                  >
                    Skip
                  </button>
                  {stepIdx > 0 && (
                    <button
                      onClick={() => setStepIdx((p) => p - 1)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  )}
                  <button
                    onClick={advanceStep}
                    className="bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-1"
                  >
                    {isLast ? 'Complete' : isNavigateStep ? 'Go →' : 'Next'} <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1 mt-3">
                {steps.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= stepIdx ? 'bg-amber-400' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* If element not found, show floating message */}
        {!targetRect && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <div className="bg-white rounded-xl shadow-2xl p-6 text-center max-w-sm">
              <p className="text-sm text-gray-700 mb-3">{currentStep.title}</p>
              <p className="text-xs text-gray-500 mb-4">{currentStep.description}</p>
              {currentStep.actionUrl && (
                <a href={currentStep.actionUrl} className="text-amber-500 text-xs underline mb-3 block">
                  Go to this page →
                </a>
              )}
              <button
                onClick={advanceStep}
                className="bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg"
              >
                {isLast ? 'Complete' : isNavigateStep ? 'Go →' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Completing ──────────────────────────────────────────────
  if (phase === 'completing') {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    )
  }

  // ── Done (Kudos) ────────────────────────────────────────────
  if (phase === 'done') {
    const rewards = config.rewards
    return (
      <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-5xl mb-4">🎉</div>
          <Award size={48} className="text-amber-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{rewards?.kudosTitle || 'Tour Complete!'}</h2>
          <p className="text-sm text-gray-500 mb-4">{rewards?.kudosMessage || "You're ready to start your journey!"}</p>

          {xpAwarded > 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
              <Sparkles size={16} className="text-amber-500" />
              <span className="text-sm font-bold text-amber-600">+{xpAwarded} XP earned!</span>
            </div>
          )}

          <button
            onClick={dismiss}
            className="w-full bg-amber-400 text-black font-semibold py-3 rounded-xl hover:bg-amber-300 transition-colors text-sm"
          >
            Start Exploring!
          </button>
        </div>
      </div>
    )
  }

  return null
}
