'use client'

import { useState } from 'react'
import { Target, Lightbulb, Volume2, ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface GuidanceStep {
  stepNumber: number
  instruction: string
  tip?: string | null
  imageUrl?: string | null
  voiceUrl?: string | null
}

interface Props {
  steps: GuidanceStep[]
  /** Compact mode for inline display (no lightbox) */
  compact?: boolean
}

/**
 * Reusable guidance step viewer — shows instructions with images and voice.
 * Used in: Arcade challenges, practice flows, any guided activity.
 */
export function GuidanceStepViewer({ steps, compact }: Props) {
  const [activeStep, setActiveStep] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (steps.length === 0) return null

  const step = steps[activeStep]

  return (
    <>
      <div className="bg-bg-surface border border-black/[0.06] rounded-xl overflow-hidden">
        {/* Step tabs */}
        {steps.length > 1 && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-black/[0.04] overflow-x-auto">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap ${
                  i === activeStep
                    ? 'bg-accent-400/15 text-accent-400'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Step {s.stepNumber}
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          {/* Image */}
          {step.imageUrl && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-full rounded-lg overflow-hidden bg-bg-inset mb-3 hover:opacity-90 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.imageUrl}
                alt={`Step ${step.stepNumber}`}
                className={`w-full object-contain ${compact ? 'max-h-28' : 'max-h-40'}`}
              />
            </button>
          )}

          {/* Instruction */}
          <p className={`text-text-primary leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
            {step.instruction}
          </p>

          {/* Tip */}
          {step.tip && (
            <div className="flex items-start gap-1.5 mt-2">
              <Lightbulb size={12} className="text-accent-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary italic">{step.tip}</p>
            </div>
          )}

          {/* Voice player */}
          {step.voiceUrl && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-black/[0.04]">
              <Volume2 size={12} className="text-purple-400 flex-shrink-0" />
              <audio src={step.voiceUrl} controls className="h-7 flex-1" style={{ maxWidth: '100%' }} />
            </div>
          )}

          {/* Prev/Next */}
          {steps.length > 1 && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/[0.04]">
              <button
                onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
                disabled={activeStep === 0}
                className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-text-secondary disabled:opacity-30"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <span className="text-[10px] text-text-muted">{activeStep + 1} / {steps.length}</span>
              <button
                onClick={() => setActiveStep((p) => Math.min(steps.length - 1, p + 1))}
                disabled={activeStep === steps.length - 1}
                className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-text-secondary disabled:opacity-30"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && step.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="bg-bg-surface rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06]">
              <span className="text-xs font-semibold text-text-tertiary">Step {step.stepNumber} of {steps.length}</span>
              <button onClick={() => setLightboxOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="bg-bg-inset">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={step.imageUrl} alt={`Step ${step.stepNumber}`} className="w-full max-h-[50vh] object-contain" />
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-text-primary leading-relaxed">{step.instruction}</p>
              {step.tip && (
                <div className="flex items-start gap-2">
                  <Lightbulb size={14} className="text-accent-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary italic">{step.tip}</p>
                </div>
              )}
              {step.voiceUrl && (
                <div className="flex items-center gap-2">
                  <Volume2 size={14} className="text-purple-400 flex-shrink-0" />
                  <audio src={step.voiceUrl} controls className="h-8 flex-1" />
                </div>
              )}
            </div>
            {steps.length > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.06]">
                <button
                  onClick={() => { setActiveStep((p) => Math.max(0, p - 1)) }}
                  disabled={activeStep === 0}
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => { setActiveStep((p) => Math.min(steps.length - 1, p + 1)) }}
                  disabled={activeStep === steps.length - 1}
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
