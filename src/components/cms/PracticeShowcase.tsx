'use client'

import { Eye, Search, Video, Sparkles, RotateCcw } from 'lucide-react'

const STEPS = [
  {
    icon: <Eye size={24} />,
    title: 'Watch',
    description: 'Study curated Hollywood scenes showcasing powerful body language.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: <Search size={24} />,
    title: 'Observe',
    description: 'Guided annotations reveal exactly what makes each moment work.',
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    icon: <Video size={24} />,
    title: 'Mimic',
    description: 'Record yourself performing the same skill in a safe practice space.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Feedback',
    description: 'AI analyzes your recording and gives a score with actionable tips.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: <RotateCcw size={24} />,
    title: 'Repeat',
    description: 'Track your progress and keep practicing until it becomes natural.',
    color: 'bg-rose-100 text-rose-600',
  },
]

export function PracticeShowcase() {
  return (
    <section className="py-24 px-4 bg-bg-base">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            The Learning Loop
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            5 steps to confident communication
          </h2>
          <p className="text-base text-text-secondary max-w-xl mx-auto">
            A proven cycle that turns cinematic inspiration into real-world skill.
          </p>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-5 gap-4 relative">
          {/* Connecting line */}
          <div className="absolute top-10 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-violet-200 via-amber-200 to-rose-200" aria-hidden="true" />

          {STEPS.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              {/* Step number + icon */}
              <div className={`relative z-10 w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mb-4 shadow-sm`}>
                {step.icon}
              </div>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">
                Step {i + 1}
              </span>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Mobile horizontal scroll */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="snap-center flex-shrink-0 w-[260px] bg-bg-surface border border-black/8 rounded-2xl p-6 shadow-card"
            >
              <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center mb-3`}>
                {step.icon}
              </div>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Step {i + 1}
              </span>
              <h3 className="text-lg font-semibold text-text-primary mt-1 mb-2">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
