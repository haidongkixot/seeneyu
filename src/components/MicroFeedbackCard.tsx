'use client'

import { CheckCircle, AlertCircle, RotateCcw, ArrowRight } from 'lucide-react'

interface MicroFeedbackCardProps {
  verdict: 'pass' | 'needs-work'
  headline: string
  detail?: string
  onNext: () => void
  onRetry: () => void
  isLastStep: boolean
}

export function MicroFeedbackCard({ verdict, headline, detail, onNext, onRetry, isLastStep }: MicroFeedbackCardProps) {
  const isPass = verdict === 'pass'

  return (
    <div className="bg-bg-elevated border border-black/10 rounded-2xl p-5 flex flex-col gap-3 animate-slide-up">
      {/* Verdict */}
      <div className="flex items-center gap-2">
        {isPass
          ? <CheckCircle size={18} className="text-success" />
          : <AlertCircle size={18} className="text-warning" />
        }
        <span className={`text-sm font-semibold uppercase tracking-wider ${isPass ? 'text-success' : 'text-warning'}`}>
          {isPass ? 'Pass' : 'Needs Work'}
        </span>
      </div>

      <div className="border-t border-black/6" />

      <p className="text-base font-semibold text-text-primary">{headline}</p>
      {detail && <p className="text-sm text-text-secondary leading-relaxed">{detail}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 border border-black/10 text-text-secondary rounded-xl px-4 py-2.5 text-sm hover:border-black/20 hover:bg-bg-overlay transition-all duration-150"
        >
          <RotateCcw size={14} />
          Retry
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-2.5 text-sm font-semibold text-center hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          {isLastStep ? 'See Results' : 'Next Step'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
