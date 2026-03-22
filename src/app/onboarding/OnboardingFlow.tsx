'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Move, Ear, Mic, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { SkillCategory, SkillLevel } from '@/lib/types'

type Phase = 'assessing' | 'processing' | 'complete'

interface SkillQuestion {
  skill: SkillCategory
  skillName: string
  icon: React.ReactNode
  description: string
  options: { label: string; text: string; level: SkillLevel }[]
}

const QUESTIONS: SkillQuestion[] = [
  {
    skill: 'eye-contact',
    skillName: 'Eye Contact',
    icon: <Eye size={32} />,
    description:
      'The ability to hold steady eye contact while speaking or listening. It signals confidence, presence, and trust.',
    options: [
      {
        label: 'Beginner',
        text: 'I often look away or find sustained eye contact uncomfortable — especially under pressure.',
        level: 'beginner',
      },
      {
        label: 'Intermediate',
        text: "I can maintain eye contact but sometimes hold it too rigidly or break it randomly — I haven't learned to use it intentionally.",
        level: 'intermediate',
      },
      {
        label: 'Advanced',
        text: 'I consciously modulate my gaze — I hold, break, and re-engage eye contact as a deliberate communication tool.',
        level: 'advanced',
      },
    ],
  },
  {
    skill: 'open-posture',
    skillName: 'Open Posture',
    icon: <Move size={32} />,
    description:
      'Using your body to project confidence and openness. Your stance, chest position, and gestures can signal trust or defensiveness.',
    options: [
      {
        label: 'Beginner',
        text: 'I tend to cross my arms, hunch my shoulders, or make myself smaller without realising it.',
        level: 'beginner',
      },
      {
        label: 'Intermediate',
        text: "I can hold open posture when I think about it, but revert under pressure — it doesn't feel natural yet.",
        level: 'intermediate',
      },
      {
        label: 'Advanced',
        text: 'I deliberately use my stance, chest position, and gestures to signal confidence — my posture is a tool I adjust intentionally.',
        level: 'advanced',
      },
    ],
  },
  {
    skill: 'active-listening',
    skillName: 'Active Listening',
    icon: <Ear size={32} />,
    description:
      'Showing others that you are fully present — tracking both words and emotions, calibrating your nods and silence.',
    options: [
      {
        label: 'Beginner',
        text: "I'm mostly thinking about what I want to say next while they're still talking, and I often jump in too quickly.",
        level: 'beginner',
      },
      {
        label: 'Intermediate',
        text: "I'm mostly listening, but I sometimes nod automatically, fill silences too quickly, or let my face go blank.",
        level: 'intermediate',
      },
      {
        label: 'Advanced',
        text: "I'm tracking both words and emotional cues — calibrating my nods, my silence, my proximity — to make the other person feel fully heard.",
        level: 'advanced',
      },
    ],
  },
  {
    skill: 'vocal-pacing',
    skillName: 'Vocal Pacing',
    icon: <Mic size={32} />,
    description:
      'Deliberately varying your tempo — slowing for emphasis, accelerating for momentum, pausing before key points to control impact.',
    options: [
      {
        label: 'Beginner',
        text: 'I speak quickly to fill space and avoid awkward silences, or rush through key points without letting them land.',
        level: 'beginner',
      },
      {
        label: 'Intermediate',
        text: "I'm aware that pacing matters, but under pressure I speed up or struggle to use pauses intentionally.",
        level: 'intermediate',
      },
      {
        label: 'Advanced',
        text: 'I deliberately vary my tempo — slow for emphasis, accelerate for momentum, pause before key points to control impact.',
        level: 'advanced',
      },
    ],
  },
  {
    skill: 'confident-disagreement',
    skillName: 'Confident Disagreement',
    icon: <ShieldCheck size={32} />,
    description:
      'Disagreeing directly and without apology — stating your position clearly, staying open in body language, and holding your ground calmly.',
    options: [
      {
        label: 'Beginner',
        text: "I either go quiet and let it pass, over-hedge ('I might be wrong but...'), or get defensive.",
        level: 'beginner',
      },
      {
        label: 'Intermediate',
        text: 'I can state my disagreement, but I sometimes add unnecessary apologies or soften it too much.',
        level: 'intermediate',
      },
      {
        label: 'Advanced',
        text: 'I disagree directly and without apology — I state my position clearly and hold my ground calmly.',
        level: 'advanced',
      },
    ],
  },
]

export function OnboardingFlow() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('assessing')
  const [step, setStep] = useState(0) // 0–4
  const [ratings, setRatings] = useState<(SkillLevel | null)[]>([null, null, null, null, null])
  const [error, setError] = useState('')

  const currentQ = QUESTIONS[step]
  const selectedLevel = ratings[step]
  const progressPct = ((step) / QUESTIONS.length) * 100

  async function handleContinue() {
    if (!selectedLevel) return
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
      return
    }
    // All 5 answered — submit
    setPhase('processing')
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratings: QUESTIONS.map((q, i) => ({
            skillCategory: q.skill,
            level: ratings[i] ?? 'beginner',
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      // Brief processing pause, then show complete
      await new Promise(r => setTimeout(r, 1800))
      setPhase('complete')
    } catch {
      setError('Something went wrong — please try again.')
      setPhase('assessing')
    }
  }

  function selectLevel(level: SkillLevel) {
    setRatings(prev => {
      const next = [...prev]
      next[step] = level
      return next
    })
  }

  if (phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-center py-20 px-6">
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-accent-400 animate-spin" />
        <h2 className="text-xl font-semibold text-text-primary">Assessing your starting level…</h2>
        <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
          We're personalising your learning path based on your self-assessment.
        </p>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-center py-20 px-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center animate-fade-in-up">
          <Sparkles size={32} className="text-accent-400" />
        </div>
        <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Your Learning Path Is Ready</h2>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            We've set your starting level for all 5 skills. Start with the clips we've picked for you, or explore the full library.
          </p>
        </div>
        <div className="w-16 border-t border-white/10" />
        <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-accent-400 text-text-inverse rounded-pill py-4 text-base font-semibold hover:bg-accent-500 hover:shadow-glow transition-all duration-150 flex items-center justify-center gap-2"
          >
            Go to My Learning Path →
          </button>
          <button
            onClick={() => router.push('/library')}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Explore All Clips
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/8">
        <span className="text-lg font-bold text-text-primary">seeneyu</span>
        <span className="text-sm text-text-secondary">{step + 1} of {QUESTIONS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/8 w-full">
        <div
          className="h-1 bg-accent-400 transition-all duration-500 ease-smooth"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-bg-surface border border-white/8 rounded-3xl p-8 flex flex-col items-center gap-6 w-full max-w-md text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center text-accent-400">
            {currentQ.icon}
          </div>

          {/* Skill name */}
          <h2 className="text-2xl font-bold text-text-primary">{currentQ.skillName}</h2>

          <div className="w-full border-t border-white/8" />

          {/* Description */}
          <p className="text-sm text-text-secondary leading-relaxed max-w-xs">{currentQ.description}</p>

          {/* Rating label */}
          <p className="text-sm font-semibold text-text-tertiary uppercase tracking-widest">
            How would you rate yourself?
          </p>

          {/* Level buttons */}
          <div className="w-full grid grid-cols-3 gap-2">
            {currentQ.options.map(opt => (
              <button
                key={opt.level}
                onClick={() => selectLevel(opt.level)}
                className={cn(
                  'py-3 rounded-xl border text-sm font-medium transition-all duration-150',
                  selectedLevel === opt.level
                    ? 'border-accent-400/60 bg-accent-400/10 text-accent-400 shadow-glow-sm'
                    : 'border-white/10 text-text-secondary hover:border-white/20 hover:bg-bg-overlay'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Selected option description */}
          {selectedLevel && (
            <p className="text-xs text-text-secondary leading-relaxed bg-bg-inset rounded-xl px-4 py-3 text-left w-full">
              {currentQ.options.find(o => o.level === selectedLevel)?.text}
            </p>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!selectedLevel}
            className="w-full bg-accent-400 text-text-inverse rounded-pill py-3.5 text-base font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step < QUESTIONS.length - 1 ? 'Continue →' : 'See My Learning Path →'}
          </button>
        </div>
      </div>
    </>
  )
}
