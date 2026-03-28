'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, RotateCcw, ArrowRight, ChevronDown, ChevronUp, Target, Lightbulb, TrendingUp } from 'lucide-react'
import type { MicroFeedbackScore } from '@/lib/types'

interface MicroFeedbackCardProps {
  verdict: 'pass' | 'needs-work'
  headline: string
  detail?: string
  scores?: MicroFeedbackScore[]
  positives?: string[]
  improvements?: string[]
  actionableTip?: string
  nextStep?: string
  onNext: () => void
  onRetry: () => void
  isLastStep: boolean
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-accent-400' : score >= 40 ? 'bg-warning' : 'bg-error'
  const textColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-accent-400' : score >= 40 ? 'text-warning' : 'text-error'

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-[140px] shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-2 bg-black/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${textColor}`}>{score}</span>
    </div>
  )
}

export function MicroFeedbackCard({
  verdict,
  headline,
  detail,
  scores,
  positives,
  improvements,
  actionableTip,
  nextStep,
  onNext,
  onRetry,
  isLastStep,
}: MicroFeedbackCardProps) {
  const isPass = verdict === 'pass'
  const hasDetailedFeedback = (scores && scores.length > 0) || (positives && positives.length > 0) || (improvements && improvements.length > 0)
  const [expanded, setExpanded] = useState(hasDetailedFeedback ? true : false)

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

      {/* Technique Scores */}
      {scores && scores.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Technique Scores</p>
          {scores.map((s, i) => (
            <ScoreBar key={i} label={s.label} score={s.score} />
          ))}
        </div>
      )}

      {/* Expandable detailed sections */}
      {hasDetailedFeedback && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors self-start"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Less detail' : 'More detail'}
          </button>

          {expanded && (
            <div className="flex flex-col gap-3 animate-slide-up">
              {/* What went well */}
              {positives && positives.length > 0 && (
                <div className="bg-success/5 border border-success/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target size={14} className="text-success" />
                    <span className="text-xs font-semibold text-success uppercase tracking-wider">What You Did Well</span>
                  </div>
                  <ul className="space-y-1.5">
                    {positives.map((p, i) => (
                      <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                        <span className="text-success shrink-0 mt-0.5">+</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas to improve */}
              {improvements && improvements.length > 0 && (
                <div className="bg-warning/5 border border-warning/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={14} className="text-warning" />
                    <span className="text-xs font-semibold text-warning uppercase tracking-wider">Areas to Improve</span>
                  </div>
                  <ul className="space-y-1.5">
                    {improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                        <span className="text-warning shrink-0 mt-0.5">-</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable tip */}
              {actionableTip && (
                <div className="bg-accent-400/5 border border-accent-400/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={14} className="text-accent-400" />
                    <span className="text-xs font-semibold text-accent-400 uppercase tracking-wider">Try This Now</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{actionableTip}</p>
                </div>
              )}

              {/* Next step */}
              {nextStep && (
                <p className="text-xs text-text-tertiary italic">
                  Next: {nextStep}
                </p>
              )}
            </div>
          )}
        </>
      )}

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
