'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { SkillBadge } from '@/components/SkillBadge'
import { StepCard } from '@/components/StepCard'
import { PracticeRecorder } from '@/components/PracticeRecorder'
import { MicroFeedbackCard } from '@/components/MicroFeedbackCard'
import { PerformanceUnlockScreen } from '@/components/PerformanceUnlockScreen'
import { useMediaPipe } from '@/hooks/useMediaPipe'
import type { PracticeStep, MicroFeedback, SkillCategory } from '@/lib/types'
import type { AnalysisSnapshot } from '@/lib/mediapipe-types'

type StepPhase = 'recording' | 'processing' | 'feedback'

interface MicroPracticeFlowProps {
  clipId: string
  characterName: string | null
  skillCategory: string
  clipTitle: string
  steps: PracticeStep[]
}

export function MicroPracticeFlow({ clipId, characterName, skillCategory, clipTitle, steps }: MicroPracticeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)   // 0-indexed
  const [phase, setPhase] = useState<StepPhase>('recording')
  const [feedback, setFeedback] = useState<MicroFeedback | null>(null)
  const [verdicts, setVerdicts] = useState<('pass' | 'needs-work')[]>([])
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

  // MediaPipe for facial + body analysis
  const { isReady: mpReady, detectAll } = useMediaPipe()

  const step = steps[currentStep]
  const totalSteps = steps.length
  const progressPct = ((currentStep) / totalSteps) * 100

  async function handleRecordComplete(blob: Blob, frames: Blob[], snapshots?: AnalysisSnapshot[]) {
    setPhase('processing')
    setError('')
    try {
      const formData = new FormData()
      formData.append('recording', blob, 'recording.webm')
      formData.append('clipId', clipId)
      formData.append('stepNumber', step.stepNumber.toString())
      formData.append('skillFocus', step.skillFocus)
      formData.append('instruction', step.instruction)
      formData.append('skillCategory', skillCategory)
      // If MediaPipe analysis available, send it; otherwise send legacy frames
      if (snapshots && snapshots.length > 0) {
        formData.append('analysisData', JSON.stringify({ snapshots }))
      } else {
        frames.forEach((f, i) => formData.append(`frame_${i}`, f, `frame_${i}.jpg`))
      }

      const res = await fetch('/api/micro-sessions', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setFeedback({ verdict: data.verdict, headline: data.headline, detail: data.detail })
      setVerdicts(prev => [...prev, data.verdict])
      setPhase('feedback')
    } catch {
      setError('Could not get feedback — please try again.')
      setPhase('recording')
    }
  }

  function handleRetry() {
    setFeedback(null)
    setVerdicts(prev => prev.slice(0, -1))
    setPhase('recording')
  }

  function handleNext() {
    if (currentStep + 1 >= totalSteps) {
      setCompleted(true)
    } else {
      setCurrentStep(i => i + 1)
      setFeedback(null)
      setPhase('recording')
    }
  }

  if (completed) {
    const allPassed = verdicts.every(v => v === 'pass')
    return (
      <div className="min-h-screen bg-bg-base flex flex-col">
        <div className="sticky top-0 z-raised bg-bg-surface/90 backdrop-blur-md border-b border-black/8 px-4 py-3 flex items-center gap-4">
          <span className="text-sm font-semibold text-text-primary">All Done!</span>
          <SkillBadge skill={skillCategory as SkillCategory} size="sm" />
          <Link href={`/library/${clipId}`} className="ml-auto text-text-tertiary hover:text-text-secondary transition-colors">
            <X size={18} />
          </Link>
        </div>
        <div className="h-1.5 bg-accent-400 w-full" />
        <main className="flex-1 flex items-center justify-center">
          <PerformanceUnlockScreen
            clipId={clipId}
            characterName={characterName}
            completedSteps={totalSteps}
            allPassed={allPassed}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-raised bg-bg-surface/90 backdrop-blur-md border-b border-black/8 px-4 py-3 flex items-center gap-4">
        <Link href={`/library/${clipId}`} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back
        </Link>
        <span className="text-sm font-semibold text-text-primary">Step {currentStep + 1} of {totalSteps}</span>
        <SkillBadge skill={skillCategory as SkillCategory} size="sm" />
        <Link href={`/library/${clipId}`} className="ml-auto text-text-tertiary hover:text-text-secondary transition-colors">
          <X size={18} />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-black/5 w-full">
        <div
          className="h-1.5 bg-accent-400 transition-all duration-500 ease-smooth"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Progress dots (mobile) */}
      <div className="flex items-center justify-center gap-2 py-2 md:hidden">
        {steps.map((_, i) => (
          <span
            key={i}
            className={
              i < currentStep ? 'w-2 h-2 rounded-full bg-accent-400'
              : i === currentStep ? 'w-3 h-3 rounded-full bg-accent-400 ring-2 ring-accent-400/30'
              : 'w-2 h-2 rounded-full bg-black/10'
            }
          />
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-4 py-6 gap-6">
        {/* Left — step card */}
        <div className="lg:w-[42%]">
          <StepCard
            stepNumber={currentStep + 1}
            totalSteps={totalSteps}
            focusLabel={step.skillFocus}
            instruction={step.instruction}
            tip={step.tip}
          />
        </div>

        {/* Right — recorder + feedback */}
        <div className="lg:w-[58%] flex flex-col gap-4">
          {phase === 'processing' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
              <div className="w-8 h-8 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Analyzing your practice…</p>
            </div>
          ) : (
            <>
              <PracticeRecorder
                stepNumber={step.stepNumber}
                onComplete={handleRecordComplete}
                detectAll={mpReady ? detectAll : undefined}
              />
              {error && <p className="text-sm text-error">{error}</p>}
              {phase === 'feedback' && feedback && (
                <MicroFeedbackCard
                  verdict={feedback.verdict}
                  headline={feedback.headline}
                  detail={feedback.detail}
                  onNext={handleNext}
                  onRetry={handleRetry}
                  isLastStep={currentStep + 1 >= totalSteps}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
