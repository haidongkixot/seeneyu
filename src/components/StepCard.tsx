import { Target, Lightbulb, Play } from 'lucide-react'

interface StepCardProps {
  stepNumber: number
  totalSteps: number
  focusLabel: string
  instruction: string
  tip?: string | null
  referenceSecond?: number
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StepCard({ stepNumber, totalSteps, focusLabel, instruction, tip, referenceSecond }: StepCardProps) {
  return (
    <div className="bg-bg-surface border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
          Step {stepNumber} of {totalSteps}
        </span>
      </div>

      <div className="border-t border-white/6" />

      <div className="flex items-center gap-2">
        <Target size={20} className="text-accent-400 w-5 h-5" />
        <span className="text-base font-semibold text-accent-400">{focusLabel}</span>
      </div>

      <p className="text-base text-text-primary leading-relaxed">{instruction}</p>

      {tip && (
        <div className="flex items-start gap-2">
          <Lightbulb size={16} className="text-accent-400 w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary italic">{tip}</p>
        </div>
      )}

      {referenceSecond != null && (
        <>
          <div className="border-t border-white/6" />
          <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
            <Play size={13} className="text-text-tertiary" />
            Jump to {formatTime(referenceSecond)} in reference clip
          </span>
        </>
      )}
    </div>
  )
}
