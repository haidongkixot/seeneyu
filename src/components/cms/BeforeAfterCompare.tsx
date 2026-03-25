import { ArrowRight, X, Check } from 'lucide-react'

const BEFORE_ITEMS = [
  'Avoiding eye contact during conversations',
  'Crossing arms and fidgeting nervously',
  'Rushing through words without pausing',
  'Looking away when challenged or questioned',
]

const AFTER_ITEMS = [
  'Holding steady, intentional eye contact',
  'Open posture that projects confidence',
  'Strategic pauses that command attention',
  'Calm presence even under pressure',
]

export function BeforeAfterCompare() {
  return (
    <section className="py-24 px-4 bg-bg-base">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            The Transformation
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            From uncertain to unforgettable
          </h2>
          <p className="text-base text-text-secondary max-w-lg mx-auto">
            See the difference intentional body language practice makes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-4 items-stretch">
          {/* Before card */}
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-8 shadow-card">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <X size={16} className="text-red-500" />
              </div>
              <span className="text-sm font-bold text-text-tertiary uppercase tracking-widest">Before</span>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              Untrained communication
            </h3>
            <ul className="space-y-3">
              {BEFORE_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <X size={12} className="text-red-400" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow connector */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-accent-400/10 flex items-center justify-center">
              <ArrowRight size={20} className="text-accent-500" />
            </div>
          </div>
          {/* Mobile arrow */}
          <div className="md:hidden flex justify-center -my-2">
            <div className="w-10 h-10 rounded-full bg-accent-400/10 flex items-center justify-center rotate-90">
              <ArrowRight size={18} className="text-accent-500" />
            </div>
          </div>

          {/* After card */}
          <div className="bg-bg-surface border-2 border-accent-400/30 rounded-2xl p-8 shadow-card relative overflow-hidden">
            {/* Accent glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-400/5 rounded-full blur-3xl" aria-hidden="true" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
                  <Check size={16} className="text-accent-600" />
                </div>
                <span className="text-sm font-bold text-accent-500 uppercase tracking-widest">After</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                Trained with seeneyu
              </h3>
              <ul className="space-y-3">
                {AFTER_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-primary font-medium">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-accent-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
