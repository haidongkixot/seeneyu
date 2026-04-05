import { Play } from 'lucide-react'

interface HeroVideoProps {
  title?: string
  subtitle?: string
  videoUrl?: string | null
  badge?: string
}

export function HeroVideo({ title, subtitle, videoUrl, badge }: HeroVideoProps) {
  const heading = title || 'See it in action'
  const desc = subtitle || 'Watch how seeneyu turns a 90-second movie clip into a personalized coaching session.'
  const badgeText = badge || (videoUrl ? 'Demo' : 'Coming soon')

  return (
    <section className="py-24 px-4 bg-bg-surface">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            Demo
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            {heading}
          </h2>
          <p className="text-base text-text-secondary max-w-lg mx-auto">
            {desc}
          </p>
        </div>

        {videoUrl ? (
          /* Actual video player */
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-lg">
            {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={videoUrl} controls className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          /* Placeholder */
          <div className="relative w-full aspect-video bg-gradient-to-br from-bg-overlay to-bg-inset rounded-3xl border border-black/8 shadow-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
              <div className="absolute top-0 left-0 right-0 h-8 bg-black" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-black" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-accent-400 flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-200">
                <Play size={32} className="text-white ml-1" fill="white" />
              </div>
              <p className="text-sm text-text-secondary font-medium">
                Watch the learning loop in 60 seconds
              </p>
            </div>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-pill px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
              {badgeText}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
