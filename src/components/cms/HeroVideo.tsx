import { Play } from 'lucide-react'

export function HeroVideo() {
  return (
    <section className="py-24 px-4 bg-bg-surface">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            Demo
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            See it in action
          </h2>
          <p className="text-base text-text-secondary max-w-lg mx-auto">
            Watch how seeneyu turns a 90-second movie clip into a personalized coaching session.
          </p>
        </div>

        {/* Video placeholder */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-bg-overlay to-bg-inset rounded-3xl border border-black/8 shadow-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300">
          {/* Decorative film strip lines */}
          <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
            <div className="absolute top-0 left-0 right-0 h-8 bg-black" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-black" />
          </div>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Play button */}
            <div className="w-20 h-20 rounded-full bg-accent-400 flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-200">
              <Play size={32} className="text-white ml-1" fill="white" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              Watch the learning loop in 60 seconds
            </p>
          </div>

          {/* Corner badge */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-pill px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
            Coming soon
          </div>
        </div>
      </div>
    </section>
  )
}
