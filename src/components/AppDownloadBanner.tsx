import { Apple } from 'lucide-react'

export function AppDownloadBanner() {
  return (
    <div className="bg-bg-overlay/50 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent-400/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text-primary">
          Get the seeneyu app
          <span className="text-text-tertiary font-normal ml-1">&mdash; coming soon</span>
        </p>
      </div>

      <div className="flex gap-2">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 bg-text-primary text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity duration-150"
        >
          <Apple size={14} />
          App Store
        </a>
        <a
          href="#"
          className="inline-flex items-center gap-1.5 bg-text-primary text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity duration-150"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.2l2.302 2.302-2.302 2.302-2.593-2.593 2.593-2.01zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z" />
          </svg>
          Google Play
        </a>
      </div>
    </div>
  )
}
