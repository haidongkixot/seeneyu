import { Star, Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'UX Designer',
    avatar: 'SC',
    quote:
      'After just 2 weeks with seeneyu, I landed a job interview and the hiring manager specifically complimented my presence. The AI feedback caught things I never noticed about myself.',
    rating: 5,
    highlight: 'Landed a dream interview',
  },
  {
    name: 'Marcus Williams',
    role: 'Sales Manager',
    avatar: 'MW',
    quote:
      'The AI feedback is surprisingly spot-on. It caught a habit I had of looking away when answering tough questions. My close rate has gone up 20% since I started practicing.',
    rating: 5,
    highlight: '20% higher close rate',
  },
  {
    name: 'Priya Patel',
    role: 'PhD Student',
    avatar: 'PP',
    quote:
      'I used to avoid eye contact in presentations. Two months in, my advisor told me my defense was the most confident she had seen from a first-year. seeneyu changed everything.',
    rating: 5,
    highlight: 'Best defense presentation',
  },
]

export function TestimonialSection() {
  return (
    <section className="py-24 px-4 bg-bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            Real Results
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            What learners say
          </h2>
          <p className="text-base text-text-secondary max-w-lg mx-auto">
            Hear from people who transformed their communication with seeneyu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative bg-white border border-black/8 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:border-accent-400/20 transition-all duration-300 flex flex-col"
            >
              {/* Quote decoration */}
              <Quote size={28} className="text-accent-400/15 mb-3" />

              {/* Highlight badge */}
              <div className="inline-flex self-start mb-4">
                <span className="text-xs font-semibold text-accent-600 bg-accent-50 rounded-pill px-3 py-1">
                  {t.highlight}
                </span>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-accent-400 fill-accent-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-sm text-text-primary leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Attribution */}
              <div className="flex items-center gap-3 pt-4 border-t border-black/6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary leading-tight">{t.name}</p>
                  <p className="text-xs text-text-tertiary">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
