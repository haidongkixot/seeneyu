'use client'

import { useState } from 'react'
import { Target, Lightbulb, Play, X, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'

interface SubStep {
  order: number
  text: string
  imageUrl?: string | null
}

interface StepCardProps {
  stepNumber: number
  totalSteps: number
  focusLabel: string
  instruction: string
  tip?: string | null
  referenceSecond?: number
  demoImageUrl?: string | null
  voiceUrl?: string | null
  subSteps?: SubStep[] | null
  onNavigate?: (step: number) => void
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StepCard({
  stepNumber, totalSteps, focusLabel, instruction, tip,
  referenceSecond, demoImageUrl, voiceUrl, subSteps, onNavigate,
}: StepCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
            Step {stepNumber} of {totalSteps}
          </span>
        </div>

        <div className="border-t border-black/6" />

        <div className="flex items-center gap-2">
          <Target size={20} className="text-accent-400 w-5 h-5" />
          <span className="text-base font-semibold text-accent-400">{focusLabel}</span>
        </div>

        {/* Demo image — clickable for lightbox */}
        {demoImageUrl && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="w-full rounded-xl overflow-hidden bg-bg-inset border border-black/[0.06] hover:border-accent-400/30 transition-colors cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={demoImageUrl} alt={focusLabel} className="w-full h-auto max-h-48 object-contain" />
            <p className="text-[10px] text-text-muted text-center py-1.5">Click to enlarge</p>
          </button>
        )}

        <p className="text-base text-text-primary leading-relaxed">{instruction}</p>

        {tip && (
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-accent-400 w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary italic">{tip}</p>
          </div>
        )}

        {/* Sub-steps */}
        {subSteps && subSteps.length > 0 && (
          <div className="space-y-1.5 pl-1">
            {subSteps.map((sub) => (
              <div key={sub.order} className="flex items-start gap-2">
                <span className="text-xs font-bold text-accent-400 mt-0.5">{sub.order}.</span>
                <p className="text-sm text-text-secondary">{sub.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Voice player */}
        {voiceUrl && (
          <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04]">
            <Volume2 size={14} className="text-purple-400 flex-shrink-0" />
            <audio src={voiceUrl} controls className="h-8 flex-1" style={{ maxWidth: '100%' }} />
          </div>
        )}

        {referenceSecond != null && (
          <>
            <div className="border-t border-black/6" />
            <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
              <Play size={13} className="text-text-tertiary" />
              Jump to {formatTime(referenceSecond)} in reference clip
            </span>
          </>
        )}
      </div>

      {/* Lightbox — full-screen step viewer with prev/next */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="bg-bg-surface rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06]">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Step {stepNumber} of {totalSteps}
              </span>
              <button onClick={() => setLightboxOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Image */}
            {demoImageUrl && (
              <div className="bg-bg-inset">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={demoImageUrl} alt={focusLabel} className="w-full h-auto max-h-[50vh] object-contain" />
              </div>
            )}

            {/* Content */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-accent-400" />
                <span className="text-base font-semibold text-accent-400">{focusLabel}</span>
              </div>

              <p className="text-sm text-text-primary leading-relaxed">{instruction}</p>

              {tip && (
                <div className="flex items-start gap-2">
                  <Lightbulb size={14} className="text-accent-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary italic">{tip}</p>
                </div>
              )}

              {subSteps && subSteps.length > 0 && (
                <div className="space-y-1.5 pl-1">
                  {subSteps.map((sub) => (
                    <div key={sub.order} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-accent-400 mt-0.5">{sub.order}.</span>
                      <p className="text-sm text-text-secondary">{sub.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Voice player in lightbox */}
              {voiceUrl && (
                <div className="flex items-center gap-2 pt-2">
                  <Volume2 size={14} className="text-purple-400 flex-shrink-0" />
                  <audio src={voiceUrl} controls className="h-8 flex-1" />
                </div>
              )}
            </div>

            {/* Prev / Next navigation */}
            {onNavigate && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.06]">
                <button
                  onClick={() => { if (stepNumber > 1) { onNavigate(stepNumber - 2); setLightboxOpen(false) } }}
                  disabled={stepNumber <= 1}
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => { if (stepNumber < totalSteps) { onNavigate(stepNumber); setLightboxOpen(false) } }}
                  disabled={stepNumber >= totalSteps}
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
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
