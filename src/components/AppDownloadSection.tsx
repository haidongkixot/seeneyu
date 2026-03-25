import { Smartphone, Apple } from 'lucide-react'

export function AppDownloadSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-accent-50/60 via-bg-surface to-bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — text + badges */}
          <div>
            <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
              Mobile App
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4 leading-tight">
              Take seeneyu anywhere
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-md">
              Practice your body language skills on the go. Record, get feedback,
              and track your progress from your phone &mdash; anytime, anywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* App Store badge */}
              <a
                href="#"
                className="inline-flex items-center gap-3 bg-text-primary text-white rounded-xl px-5 py-3 hover:opacity-90 transition-opacity duration-150 shadow-md"
              >
                <Apple size={24} />
                <div className="text-left">
                  <p className="text-[10px] leading-none opacity-80">Download on the</p>
                  <p className="text-sm font-semibold leading-tight">App Store</p>
                </div>
              </a>

              {/* Google Play badge */}
              <a
                href="#"
                className="inline-flex items-center gap-3 bg-text-primary text-white rounded-xl px-5 py-3 hover:opacity-90 transition-opacity duration-150 shadow-md"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.2l2.302 2.302-2.302 2.302-2.593-2.593 2.593-2.01zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z" />
                </svg>
                <div className="text-left">
                  <p className="text-[10px] leading-none opacity-80">Get it on</p>
                  <p className="text-sm font-semibold leading-tight">Google Play</p>
                </div>
              </a>
            </div>

            <p className="text-xs text-text-tertiary mt-4">
              Coming soon. Join the waitlist to get notified.
            </p>
          </div>

          {/* Right — phone mockup placeholder */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-[260px] h-[520px]">
              {/* Phone frame */}
              <div className="absolute inset-0 bg-text-primary rounded-[40px] shadow-xl p-3">
                <div className="w-full h-full bg-bg-base rounded-[32px] overflow-hidden flex flex-col items-center justify-center">
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-text-primary rounded-full z-10" />

                  {/* Screen content placeholder */}
                  <div className="text-center px-6">
                    <Smartphone size={40} className="text-accent-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-text-primary mb-1">seeneyu</p>
                    <p className="text-xs text-text-tertiary leading-relaxed">
                      AI-powered body language coaching in your pocket
                    </p>
                  </div>

                  {/* Bottom bar indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-1 bg-black/10 rounded-full" />
                </div>
              </div>

              {/* Floating accent glow */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-12 bg-accent-400/20 rounded-full blur-2xl" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
